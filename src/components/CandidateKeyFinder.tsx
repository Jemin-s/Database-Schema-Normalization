import React from 'react';
import { useSchema } from '../contexts/SchemaProvider';
import { useDependency } from '../contexts/DependencyProvider';

interface Dependency {
  left: string[];
  right: string[];
}

const computeClosure = (attributes: string[], dependencies: Dependency[]) => {
  const closure = new Set(attributes);
  let changed = true;

  while (changed) {
    changed = false;

    for (const dependency of dependencies) {
      if (dependency.left.every(attr => closure.has(attr))) {
        const initialSize = closure.size;
        dependency.right.forEach(attr => closure.add(attr));

        if (closure.size > initialSize) {
          changed = true;
        }
      }
    }
  }

  return Array.from(closure);
};

const generateSubsets = (set: string[]) => {
  const subsets: string[][] = [];
  const total = 1 << set.length;

  for (let mask = 1; mask < total; mask++) {
    const subset = set.filter((_, i) => mask & (1 << i));
    subsets.push(subset);
  }

  return subsets;
};

const CandidateKeyFinder: React.FC = () => {
  const { columns } = useSchema();
  const { dependencies } = useDependency();

  const allAttributes = columns.map(col => col.name);

  // Identify superkeys
  const superkeys = generateSubsets(allAttributes).filter(subset =>
    computeClosure(subset, dependencies).sort().join('') === allAttributes.sort().join('')
  );

  // Identify minimal superkeys (Candidate Keys)
  const candidateKeys = superkeys.filter(superkey =>
    !superkeys.some(otherKey =>
      otherKey.length < superkey.length && otherKey.every(attr => superkey.includes(attr))
    )
  );

  return (
    <section>
      <h2 className="text-2xl font-medium">Candidate Key Finder</h2>
      <div className="bg-neutral-800 rounded-sm p-8 mt-4">
        <h3 className="text-lg font-medium mb-4">Candidate Keys</h3>
        <div className="bg-gray-200 text-gray-800 p-4 rounded-md">
          {candidateKeys.length > 0 ? (
            candidateKeys.map((key, index) => (
              <div key={index}>
                <strong>Key {index + 1}:</strong> {`{ ${key.join(', ')} }`}
              </div>
            ))
          ) : (
            <p>No candidate keys found.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CandidateKeyFinder;