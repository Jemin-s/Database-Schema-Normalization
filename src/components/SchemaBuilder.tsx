import { useSchema } from "../contexts/SchemaProvider";

export default function SchemaBuilder() {
  const { tableName, setTableName, columns, setColumns } = useSchema();

  const handleAddColumn = () => {
    setColumns([...columns, { name: "", type: "" }]);
  };

  const handleColumnChange = (
    index: number,
    key: "name" | "type",
    value: string
  ) => {
    const updatedColumns = [...columns];
    updatedColumns[index][key] = value;
    setColumns(updatedColumns);
  };

  const handleRemoveColumn = (index: number) => {
    const updatedColumns = columns.filter((_, i) => i !== index);
    if(updatedColumns.length === 0) {
      updatedColumns.push({ name: "", type: "" });
    }
    setColumns(updatedColumns);
  };

  return (
    <section>
      <div>
        <h2 className="text-2xl font-medium">Create Table</h2>
        <div className="bg-neutral-800 rounded-sm py-6 px-8 mt-4">
          <div>
            <label className="block text-lg font-medium">Table Name</label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="bg-gray-200 text-gray-800 w-1/3 p-2 border rounded mt-2"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mt-6">Add Columns</h3>
            {columns.map((col, index) => (
              <div key={index} className="flex items-center space-x-4 mt-2">
                <input
                  type="text"
                  value={col.name}
                  onChange={(e) =>
                    handleColumnChange(index, "name", e.target.value)
                  }
                  placeholder="Column Name"
                  className="bg-gray-200 text-gray-800 p-2 border rounded w-1/2"
                />
                <select
                  value={col.type}
                  onChange={(e) =>
                    handleColumnChange(index, "type", e.target.value)
                  }
                  className="bg-gray-200 text-gray-800 p-2 border rounded w-1/5"
                >
                  <option value="">Select Data Type</option>
                  <option value="INT">INT</option>
                  <option value="INT[]">INT[]</option>
                  <option value="VARCHAR">VARCHAR</option>
                  <option value="VARCHAR[]">VARCHAR[]</option>
                  <option value="DATE">DATE</option>
                  <option value="DATE[]">DATE[]</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="BOOLEAN[]">BOOLEAN[]</option>
                </select>
                <button
                  onClick={() => handleRemoveColumn(index)}
                  className="px-3 py-1 bg-red-500 text-white rounded transition duration-200 ease-in-out hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={handleAddColumn}
              className="mt-6 px-4 py-2 bg-green-500 text-white rounded transition duration-200 ease-in-out hover:bg-green-600"
            >
              + Add Column
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}