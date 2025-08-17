export interface TableColumn {
  key: string;          // Propiedad en el objeto (ej: 'name', 'username')
  label: string;        // Texto en el header (ej: 'Nombre', 'Usuario')
  type?: 'text' | 'date' | 'currency' | 'rentalStatus' | 'action'; // Para dar formato
  actions?: TableAction[];
}

export interface TableAction {
  icon: string;                     // nombre del ícono
  tooltip?: string;                 // texto opcional
  disabled?: (row: any) => boolean; // función que define si está deshabilitado
  onClick?: (row: any) => void;     // callback opcional
}