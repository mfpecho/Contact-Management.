import { Contact } from '../types';

export interface ContactFilters {
  search: string;
  company: string;
  owner: string;
  phone: string;
  birthdayFrom: string;
  birthdayTo: string;
}

// Utility function to apply filters to contacts
export const applyContactFilters = (contacts: Contact[], filters: ContactFilters): Contact[] => {
  return contacts.filter(contact => {
    // Basic search filter
    const matchesSearch = filters.search === '' || Object.values(contact).some(value =>
      value?.toString().toLowerCase().includes(filters.search.toLowerCase())
    );

    // Advanced filters
    const matchesCompany = filters.company === '' || contact.company?.toLowerCase().includes(filters.company.toLowerCase());
    const matchesOwner = filters.owner === '' || contact.ownerName?.toLowerCase().includes(filters.owner.toLowerCase());
    const matchesPhone = filters.phone === '' || contact.contactNumber?.toLowerCase().includes(filters.phone.toLowerCase());
    
    // Birthday range filter
    let matchesBirthdayRange = true;
    if (filters.birthdayFrom || filters.birthdayTo) {
      const contactBirthday = new Date(contact.birthday);
      const fromDate = filters.birthdayFrom ? new Date(filters.birthdayFrom) : new Date('1900-01-01');
      const toDate = filters.birthdayTo ? new Date(filters.birthdayTo) : new Date('2100-12-31');
      matchesBirthdayRange = contactBirthday >= fromDate && contactBirthday <= toDate;
    }

    return matchesSearch && matchesCompany && matchesOwner && matchesPhone && matchesBirthdayRange;
  });
};

// Default empty filters
export const createEmptyFilters = (): ContactFilters => ({
  search: '',
  company: '',
  owner: '',
  phone: '',
  birthdayFrom: '',
  birthdayTo: ''
});

// Check if any filters are active
export const hasActiveFilters = (filters: ContactFilters): boolean => {
  return !!(filters.search || filters.company || filters.owner || filters.phone || filters.birthdayFrom || filters.birthdayTo);
};