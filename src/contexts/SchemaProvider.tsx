import { createContext, useContext, useState, ReactNode } from 'react';

interface Column {
  name: string;
  type: string;
}

interface SchemaContextType {
  tableName: string;
  columns: Column[];
  setTableName: (name: string) => void;
  setColumns: (columns: Column[]) => void;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

interface SchemaProviderProps {
  children: ReactNode;
}

export function SchemaProvider({ children }: SchemaProviderProps) {
  const [tableName, setTableName] = useState<string>('');
  const [columns, setColumns] = useState<Column[]>([{ name: "", type: "" }]);

  return (
    <SchemaContext.Provider value={{ tableName, columns, setTableName, setColumns }}>
      {children}
    </SchemaContext.Provider>
  );
}

export function useSchema() {
  const context = useContext(SchemaContext);
  if (!context) {
    throw new Error('useSchema must be used within a SchemaProvider');
  }
  return context;
}