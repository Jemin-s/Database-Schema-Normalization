import { useState } from 'react';
import { useSchema } from '../contexts/SchemaProvider';
import { useDependency } from '../contexts/DependencyProvider';

interface Dependency {
  left: string[];
  right: string[];
}

export default function FunctionalDependencies() {
  const { tableName, columns } = useSchema();
  const { dependencies, setDependencies } = useDependency();

  const [rawInputs, setRawInputs] = useState<{ left: string; right: string }[]>(
    dependencies.map(dep => ({
      left: dep.left.join(', '),
      right: dep.right.join(', ')
    }))
  );

  const validAttributes = columns.map((col) => col.name);

  const isValidDependency = (dependency: Dependency) => {
    const allAttributes = [...dependency.left, ...dependency.right];

    return (
      allAttributes.every(attr => validAttributes.includes(attr)) &&
      dependency.left.length > 0 && dependency.right.length > 0
    );
  };

  const parseInput = (value: string) =>
    value
      .split(/\s*,\s*/)
      .filter(Boolean);

  const handleAddDependency = () => {
    const allValid = dependencies.every(isValidDependency);
    if (!allValid) {
      alert('Please ensure all attributes are valid and fields are filled before adding a new one.');
      return;
    }
    setDependencies([...dependencies, { left: [], right: [] }]);
    setRawInputs([...rawInputs, { left: '', right: '' }]);
  };

  const handleDependencyChange = (index: number, key: 'left' | 'right', value: string) => {
    const updatedRawInputs = [...rawInputs];
    updatedRawInputs[index][key] = value;
    setRawInputs(updatedRawInputs);
  };

  const handleBlur = (index: number, key: keyof Dependency, value: string) => {
    const updatedDependencies = [...dependencies];
    updatedDependencies[index][key] = parseInput(value);
    setDependencies(updatedDependencies);
  };

  const handleRemoveDependency = (index: number) => {
    const updatedDependencies = dependencies.filter((_, i) => i !== index);
    const updatedRawInputs = rawInputs.filter((_, i) => i !== index);

    if (updatedDependencies.length === 0) {
      updatedDependencies.push({ left: [], right: [] });
      updatedRawInputs.push({ left: '', right: '' });
    }

    setDependencies(updatedDependencies);
    setRawInputs(updatedRawInputs);
  };

  return (
    <section>
      <h2 className="text-2xl font-medium">{tableName}</h2>

      <div className="bg-neutral-800 rounded-sm p-8 mt-4">
        <h3 className="text-lg font-medium">Add Functional Dependencies</h3>
        <div className="bg-gray-200 text-gray-800 p-4 rounded-md mb-4 max-w-1/2 my-2">
          <p className="font-semibold">How to Enter Dependencies:</p>
          <ul className="list-disc pl-5">
            <li><b>Single Attribute:</b> Enter `A → B`</li>
            <li><b>Multiple Attributes on LHS:</b> Enter `A, B → C`</li>
            <li><b>Multiple Attributes on RHS:</b> Enter `A → B, C`</li>
            <li><b>Composite Keys:</b> Split `AB → C` as `A, B → C`</li>
          </ul>
          <p className="mt-2 italic">Separate attributes using commas (`,`). Spaces are optional.</p>
        </div>

        {dependencies.map((_, index) => (
          <div key={index} className="flex items-center space-x-4 mt-4">
            <input
              type="text"
              value={rawInputs[index]?.left || ''}
              onChange={(e) => handleDependencyChange(index, 'left', e.target.value)}
              onBlur={(e) => handleBlur(index, 'left', e.target.value)}
              placeholder="LHS (e.g., A, B)"
              className="bg-gray-200 text-gray-800 p-2 border rounded w-1/5"
            />
            <span className="text-white">→</span>
            <input
              type="text"
              value={rawInputs[index]?.right || ''}
              onChange={(e) => handleDependencyChange(index, 'right', e.target.value)}
              onBlur={(e) => handleBlur(index, 'right', e.target.value)}
              placeholder="RHS (e.g., C)"
              className="bg-gray-200 text-gray-800 p-2 border rounded w-1/5"
            />
            <button
              onClick={() => handleRemoveDependency(index)}
              className="px-3 py-1 bg-red-500 text-white rounded transition duration-200 ease-in-out hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          onClick={handleAddDependency}
          className="mt-6 px-4 py-2 bg-green-500 text-white rounded transition duration-200 ease-in-out hover:bg-green-600"
        >
          + Add Dependency
        </button>
      </div>
    </section>
  );
}