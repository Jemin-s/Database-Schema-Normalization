import { createContext, useContext, useState, ReactNode } from 'react';

interface Dependency {
  left: string[];
  right: string[];
}

interface DependencyContextType {
  dependencies: Dependency[];
  setDependencies: (dependencies: Dependency[]) => void;
}

const DependencyContext = createContext<DependencyContextType | undefined>(undefined);

interface DependencyProviderProps {
  children: ReactNode;
}

export function DependencyProvider({ children }: DependencyProviderProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([{ left: [], right: [] }]);

  return (
    <DependencyContext.Provider value={{ dependencies, setDependencies }}>
      {children}
    </DependencyContext.Provider>
  );
}

export function useDependency() {
  const context = useContext(DependencyContext);
  if (!context) {
    throw new Error('useDependency must be used within a DependencyProvider');
  }
  return context;
}