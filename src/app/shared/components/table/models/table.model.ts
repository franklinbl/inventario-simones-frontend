export interface TableColumn {
  key: string;          // Propiedad en el objeto (ej: 'name', 'username')
  label: string;        // Texto en el header (ej: 'Nombre', 'Usuario')
  type?: 'text' | 'date' | 'currency' | 'action'; // Para dar formato
}