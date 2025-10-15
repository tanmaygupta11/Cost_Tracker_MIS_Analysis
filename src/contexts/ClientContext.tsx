import { createContext, useContext, useState, ReactNode } from 'react';

interface ClientContextType {
  customerId: string | null;
  customerName: string | null;
  setClient: (customerId: string, customerName: string) => void;
  clearClient: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [customerId, setCustomerId] = useState<string | null>(() => {
    // Try to restore from localStorage
    return localStorage.getItem('client_customer_id');
  });
  const [customerName, setCustomerName] = useState<string | null>(() => {
    return localStorage.getItem('client_customer_name');
  });

  const setClient = (id: string, name: string) => {
    setCustomerId(id);
    setCustomerName(name);
    localStorage.setItem('client_customer_id', id);
    localStorage.setItem('client_customer_name', name);
  };

  const clearClient = () => {
    setCustomerId(null);
    setCustomerName(null);
    localStorage.removeItem('client_customer_id');
    localStorage.removeItem('client_customer_name');
  };

  return (
    <ClientContext.Provider value={{ customerId, customerName, setClient, clearClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}

