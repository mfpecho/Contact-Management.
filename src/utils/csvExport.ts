import { Contact } from '../types';

export const exportToCSV = (contacts: Contact[], filename: string = 'contacts.csv') => {
  const headers = ['First Name', 'Middle Name', 'Last Name', 'Birthday', 'Contact Number', 'Company', 'Owner', 'Created At'];
  
  const csvContent = [
    headers.join(','),
    ...contacts.map(contact => [
      contact.firstName,
      contact.middleName,
      contact.lastName,
      contact.birthday,
      contact.contactNumber,
      contact.company,
      contact.ownerName,
      new Date(contact.createdAt).toLocaleDateString()
    ].map(field => `"${field}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
