import React from 'react';
import { useSchema } from '../contexts/SchemaProvider';
import { useDependency } from '../contexts/DependencyProvider';

interface Dependency {
  left: string[];
  right: string[];
}

interface NormalizedTable {
  name: string;
  attributes: string[];
  primaryKey: string[];
  dependencies: Dependency[];
}

const Normalization: React.FC = () => {
  const { tableName, columns } = useSchema();
  const { dependencies } = useDependency();
  
  const allAttributes = React.useMemo(() => columns.map(col => col.name), [columns]);
  
  // Helper function to compute closure with cycle detection
  const computeClosure = React.useCallback((attributes: string[], deps: Dependency[]): string[] => {
    const closure = new Set(attributes);
    let changed = true;
    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops

    while (changed && iterations < maxIterations) {
      changed = false;
      for (const dep of deps) {
        if (dep.left.every(attr => closure.has(attr))) {
          const initialSize = closure.size;
          dep.right.forEach(attr => closure.add(attr));
          if (closure.size > initialSize) {
            changed = true;
          }
        }
      }
      iterations++;
    }

    if (iterations >= maxIterations) {
      console.warn("Closure computation reached maximum iterations - possible circular dependency");
    }

    return Array.from(closure).sort();
  }, []);

  // Helper to check if a dependency violates BCNF
  const violatesBCNF = React.useCallback((dep: Dependency, candidateKeys: string[][], allAttrs: string[]): boolean => {
    // Skip trivial dependencies (where right is subset of left)
    if (dep.right.every(attr => dep.left.includes(attr))) {
      return false;
    }

    const determinantClosure = computeClosure(dep.left, dependencies);
    const isSuperkey = determinantClosure.length === allAttrs.length;
    
    // Check if the determinant contains a candidate key
    const containsCandidateKey = candidateKeys.some(key => 
      key.every(attr => dep.left.includes(attr))
    );
    
    return !isSuperkey && !containsCandidateKey;
  }, [computeClosure, dependencies]);

  // Generate all non-empty subsets for candidate key finding (optimized)
  const generateSubsets = React.useCallback((set: string[]): string[][] => {
    if (set.length > 12) {
      console.warn("Too many attributes for subset generation - performance may suffer");
    }

    const subsets: string[][] = [];
    const total = 1 << set.length;

    for (let mask = 1; mask < total; mask++) {
      const subset = [];
      for (let i = 0; i < set.length; i++) {
        if (mask & (1 << i)) {
          subset.push(set[i]);
        }
      }
      subsets.push(subset);
    }

    // Sort by length to prioritize smaller subsets
    return subsets.sort((a, b) => a.length - b.length);
  }, []);

  // Find candidate keys (optimized)
  const findCandidateKeys = React.useCallback((attrs: string[], deps: Dependency[]): string[][] => {
    if (attrs.length === 0) return [];
    
    // First check for empty dependencies case
    if (deps.length === 0) {
      return [attrs]; // All attributes together form the key
    }

    let superkeys: string[][] = [];
    const subsets = generateSubsets(attrs);
    const attrsSortedStr = [...attrs].sort().join(',');

    for (const subset of subsets) {
      // Skip subsets larger than smallest found superkey
      if (superkeys.length > 0 && subset.length > superkeys[0].length) {
        continue;
      }

      const closure = computeClosure(subset, deps);
      if (closure.sort().join(',') === attrsSortedStr) {
        // Check if this is a minimal superkey
        const isMinimal = !superkeys.some(key => 
          key.length <= subset.length && 
          key.every(attr => subset.includes(attr))
        );

        if (isMinimal) {
          // Remove any existing superkeys that are supersets of this one
          superkeys = superkeys.filter(key => 
            !(key.length >= subset.length && subset.every(attr => key.includes(attr)))
          );
          superkeys.push(subset);
        }
      }
    }

    return superkeys;
  }, [computeClosure, generateSubsets]);

  // Normalize to BCNF with improved decomposition
  const normalizeToBCNF = React.useCallback((): NormalizedTable[] => {
    if (allAttributes.length === 0) return [];
    
    const tables: NormalizedTable[] = [{
      name: tableName,
      attributes: [...allAttributes],
      primaryKey: [],
      dependencies: [...dependencies]
    }];
    
    const result: NormalizedTable[] = [];
    let tableCounter = 1;
    const processedTables = new Set<string>();
    
    while (tables.length > 0) {
      const currentTable = tables.shift()!;
      const tableKey = currentTable.attributes.sort().join(',');
      
      // Skip already processed tables
      if (processedTables.has(tableKey)) continue;
      processedTables.add(tableKey);
      
      // Find candidate keys for this table
      const candidateKeys = findCandidateKeys(currentTable.attributes, currentTable.dependencies);
      
      // Set primary key if not already set
      if (currentTable.primaryKey.length === 0 && candidateKeys.length > 0) {
        currentTable.primaryKey = candidateKeys[0];
      }
      
      // Check for BCNF violations
      const violatingDep = currentTable.dependencies.find(dep => 
        violatesBCNF(dep, candidateKeys, currentTable.attributes)
      );
      
      if (violatingDep) {
        // This table violates BCNF, so decompose it
        
        // Create first table with the determinant and its closure
        const closure = computeClosure(violatingDep.left, currentTable.dependencies);
        const table1Attributes = Array.from(new Set([...violatingDep.left, ...closure]));
        
        // Create dependencies for the new table
        const table1Deps = currentTable.dependencies
          .filter(dep => 
            dep.left.every(attr => table1Attributes.includes(attr)) && 
            dep.right.every(attr => table1Attributes.includes(attr))
          )
          .filter(dep => dep.left.length > 0 && dep.right.length > 0); // Skip invalid deps
        
        const table1: NormalizedTable = {
          name: `${tableName}_${tableCounter++}`,
          attributes: table1Attributes,
          primaryKey: violatingDep.left,
          dependencies: table1Deps
        };
        
        // Create second table with attributes not in the closure, plus the determinant
        const table2Attributes = Array.from(new Set([
          ...violatingDep.left,
          ...currentTable.attributes.filter(attr => !closure.includes(attr) || violatingDep.left.includes(attr))
        ]));
        
        // Create dependencies for the second table
        const table2Deps = currentTable.dependencies
          .filter(dep => 
            dep.left.every(attr => table2Attributes.includes(attr)) && 
            dep.right.every(attr => table2Attributes.includes(attr))
          )
          .filter(dep => dep.left.length > 0 && dep.right.length > 0); // Skip invalid deps
        
        const table2: NormalizedTable = {
          name: `${tableName}_${tableCounter++}`,
          attributes: table2Attributes,
          primaryKey: [], // Will be set in next iteration
          dependencies: table2Deps
        };
        
        // Add these tables for further processing
        if (table1.attributes.length > 0) {
          tables.push(table1);
        }
        if (table2.attributes.length > 0) {
          tables.push(table2);
        }
      } else {
        // This table is already in BCNF
        result.push(currentTable);
      }
    }
    
    return result;
  }, [allAttributes, computeClosure, dependencies, findCandidateKeys, tableName, violatesBCNF]);

  // Check if the schema is already in 1NF
  const is1NF = React.useCallback((): boolean => {
    // In 1NF, all attributes should be atomic (not arrays or composite)
    return columns.every(col => {
      // More comprehensive atomic type checking
      const type = col.type.toLowerCase();
      return !type.includes('[]') && 
             !type.includes('array') && 
             !type.includes('composite') &&
             !type.includes('json') &&
             !type.includes('object');
    });
  }, [columns]);

  // Check if in 2NF: 1NF + no partial dependencies
  const is2NF = React.useCallback((candidateKeys: string[][]): boolean => {
    if (!is1NF()) return false;
    if (candidateKeys.length === 0) return false;
    
    // Check if any non-key attribute depends on only part of the candidate key
    for (const key of candidateKeys) {
      if (key.length <= 1) continue; // No partial dependencies possible with single-attribute keys
      
      // Generate all proper subsets of the key
      const keySubsets = generateSubsets(key).filter(subset => 
        subset.length > 0 && subset.length < key.length
      );
      
      // Check if any non-key attribute depends on a proper subset of the key
      const nonKeyAttributes = allAttributes.filter(attr => 
        !candidateKeys.some(candidateKey => candidateKey.includes(attr))
      );
      
      for (const subset of keySubsets) {
        const subsetClosure = computeClosure(subset, dependencies);
        const dependentNonKeyAttrs = nonKeyAttributes.filter(attr => subsetClosure.includes(attr));
        
        if (dependentNonKeyAttrs.length > 0) {
          return false;
        }
      }
    }
    return true;
  }, [allAttributes, computeClosure, dependencies, generateSubsets, is1NF]);

  // Check if in 3NF: 2NF + no transitive dependencies
  const is3NF = React.useCallback((candidateKeys: string[][]): boolean => {
    if (!is2NF(candidateKeys)) return false;
    if (candidateKeys.length === 0) return false;
    
    const isKeyAttribute = (attr: string) => 
      candidateKeys.some(key => key.includes(attr));
    
    // Check for transitive dependencies
    for (const dep of dependencies) {
      if (dep.left.length === 0) continue; // Skip invalid dependencies
      
      // Only concerned with dependencies where right side is non-key
      const nonKeyRightSide = dep.right.filter(attr => !isKeyAttribute(attr));
      
      if (nonKeyRightSide.length > 0) {
        // Check if left side is NOT a superkey and NOT a subset of any candidate key
        const leftSideClosure = computeClosure(dep.left, dependencies);
        const isSuperkey = leftSideClosure.length === allAttributes.length;
        
        const isSubsetOfKey = candidateKeys.some(key => 
          dep.left.every(attr => key.includes(attr))
        );
        
        if (!isSuperkey && !isSubsetOfKey) {
          return false;
        }
      }
    }
    return true;
  }, [allAttributes, computeClosure, dependencies, is2NF]);

  // Calculate normalization status with memoization
  const { normalForms, normalizedTables } = React.useMemo(() => {
  const candKeys = findCandidateKeys(allAttributes, dependencies);
    const forms = {
      is1NF: is1NF(),
      is2NF: candKeys.length > 0 ? is2NF(candKeys) : false,
      is3NF: candKeys.length > 0 ? is3NF(candKeys) : false,
      isBCNF: candKeys.length > 0 ? dependencies.every(dep => 
        !violatesBCNF(dep, candKeys, allAttributes)
      ) : false
    };
    
    const normalized = forms.isBCNF ? 
      [{ name: tableName, attributes: allAttributes, primaryKey: candKeys[0] || [], dependencies }] : 
      normalizeToBCNF();
    
    return { candidateKeys: candKeys, normalForms: forms, normalizedTables: normalized };
  }, [allAttributes, dependencies, findCandidateKeys, is1NF, is2NF, is3NF, normalizeToBCNF, tableName, violatesBCNF]);

  return (
    <section>
      <h2 className="text-2xl font-medium">Normalization</h2>
      <div className="bg-neutral-800 rounded-sm p-8 mt-4">
        <h3 className="text-lg font-medium mb-4">Current Normal Form</h3>
        <div className="bg-gray-200 text-gray-800 p-4 rounded-md mb-6">
          <div className={`p-2 ${normalForms.is1NF ? 'text-green-700' : 'text-red-700'}`}>
            <strong>1NF:</strong> {normalForms.is1NF ? '✓ Satisfied' : '✗ Not satisfied'}
            {!normalForms.is1NF && <p className="text-sm">All attributes must be atomic (not array or composite types)</p>}
          </div>
          <div className={`p-2 ${normalForms.is2NF ? 'text-green-700' : 'text-red-700'}`}>
            <strong>2NF:</strong> {normalForms.is2NF ? '✓ Satisfied' : '✗ Not satisfied'}
            {!normalForms.is2NF && normalForms.is1NF && <p className="text-sm">Remove partial dependencies (non-key attributes dependent on part of a composite key)</p>}
          </div>
          <div className={`p-2 ${normalForms.is3NF ? 'text-green-700' : 'text-red-700'}`}>
            <strong>3NF:</strong> {normalForms.is3NF ? '✓ Satisfied' : '✗ Not satisfied'}
            {!normalForms.is3NF && normalForms.is2NF && <p className="text-sm">Remove transitive dependencies (non-key attributes dependent on other non-key attributes)</p>}
          </div>
          <div className={`p-2 ${normalForms.isBCNF ? 'text-green-700' : 'text-red-700'}`}>
            <strong>BCNF:</strong> {normalForms.isBCNF ? '✓ Satisfied' : '✗ Not satisfied'}
            {!normalForms.isBCNF && normalForms.is3NF && <p className="text-sm">All determinants must be superkeys (no non-trivial dependencies where left side isn't a superkey)</p>}
          </div>
        </div>

        <h3 className="text-lg font-medium mb-4">Normalized Tables (BCNF)</h3>
        {normalizedTables.length === 0 ? (
          <div className="bg-gray-200 text-gray-800 p-4 rounded-md mb-4">
            No tables to normalize (empty schema)
          </div>
        ) : (
          normalizedTables.map((table, index) => (
            <div key={index} className="bg-gray-200 text-gray-800 p-4 rounded-md mb-4">
              <h4 className="font-bold">{table.name}</h4>
              <div className="mt-2">
                <strong>Attributes:</strong> {`{ ${table.attributes.join(', ')} }`}
              </div>
              <div className="mt-2">
                <strong>Primary Key:</strong> {`{ ${table.primaryKey.join(', ')} }`}
              </div>
              <div className="mt-2">
                <strong>Dependencies:</strong>
                {table.dependencies.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {table.dependencies.map((dep, depIndex) => (
                      <li key={depIndex}>
                        {`${dep.left.join(', ')} → ${dep.right.join(', ')}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span> None</span>
                )}
              </div>
            </div>
          ))
        )}

        <h3 className="text-lg font-medium mb-4">Normalization Process</h3>
        <div className="bg-gray-200 text-gray-800 p-4 rounded-md">
          <p className="mb-2"><strong>1NF to 2NF:</strong> Eliminate partial dependencies by creating separate tables for each partial dependency.</p>
          <p className="mb-2"><strong>2NF to 3NF:</strong> Eliminate transitive dependencies by creating separate tables for non-key attributes that depend on other non-key attributes.</p>
          <p className="mb-2"><strong>3NF to BCNF:</strong> Ensure every determinant is a superkey by decomposing relations where this is not the case.</p>
          <p className="mt-4 text-sm text-gray-600">Note: This algorithm may produce more tables than strictly necessary in some cases to ensure BCNF compliance.</p>
        </div>
      </div>
    </section>
  );
};

export default Normalization;