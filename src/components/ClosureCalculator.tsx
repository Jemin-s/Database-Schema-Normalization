import React from 'react';
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

const ClosureCalculator: React.FC = () => {
  const { dependencies } = useDependency();

  const allAttributes = new Set(
    dependencies.flatMap(dep => [...dep.left, ...dep.right])
  );

  const closures = Array.from(allAttributes).map(attribute => ({
    attribute,
    closure: computeClosure([attribute], dependencies)
  }));

  return (
    <section>
      <h2 className="text-2xl font-medium">Closure Calculator</h2>
      <div className="bg-neutral-800 rounded-sm p-8 mt-4">
        <h3 className="text-lg font-medium mb-4">Attribute Closures</h3>
        <div className="bg-gray-200 text-gray-800 p-4 rounded-md mb-4">
          {closures.map(({ attribute, closure }) => (
            <div key={attribute}>
              <strong>{attribute}⁺</strong> = {`{ ${closure.join(', ')} }`}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClosureCalculator;