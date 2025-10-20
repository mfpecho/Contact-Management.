import React, { useState, useEffect } from 'react';
import { Calendar, Gift, Users, ChevronRight, X } from 'lucide-react';
import { Contact } from '../types';

interface BirthdayBoxProps {
  contacts: Contact[];
  currentUserId: string;
}

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayBirthdays: Contact[];
  upcomingBirthdays: Contact[];
  oneMonthAdvanceBirthdays: Contact[];
  collaborativeBirthdays: Contact[];
  personalBirthdays: Contact[];
}

// Shared helper functions
const getDaysUntilBirthday = (birthday: string) => {
  if (!birthday) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse birthday string consistently (assuming YYYY-MM-DD format)
  const parts = birthday.split('-');
  if (parts.length !== 3) return 0;
  
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;
  
  // Create this year's birthday
  const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
  thisYearBirthday.setHours(0, 0, 0, 0);
  
  // If birthday already passed this year, use next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const timeDiff = thisYearBirthday.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

const BirthdayModal: React.FC<BirthdayModalProps> = ({ 
  isOpen, 
  onClose, 
  todayBirthdays, 
  upcomingBirthdays, 
  oneMonthAdvanceBirthdays,
  collaborativeBirthdays, 
  personalBirthdays 
}) => {
  if (!isOpen) return null;

const formatBirthdayDate = (birthday: string) => {
  if (!birthday) return 'Invalid Date';
  
  // Parse birthday string consistently (assuming YYYY-MM-DD format)
  const parts = birthday.split('-');
  if (parts.length !== 3) return 'Invalid Date';
  
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Invalid Date';
  
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Birthday Calendar</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming birthdays and celebrations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Today's Birthdays */}
          {todayBirthdays.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-red-100 dark:bg-red-800 rounded-lg">
                  <Gift className="w-4 h-4 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Birthdays 🎉</h3>
              </div>
              <div className="space-y-3">
                {todayBirthdays.map(contact => (
                  <div key={contact.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100">
                          {contact.firstName} {contact.lastName}
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {contact.company} • Owner: {contact.ownerName}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Born: {formatBirthdayDate(contact.birthday)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl">🎂</div>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">Today!</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Birthdays */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Birthdays
              </h3>
            </div>
            
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎈</div>
                <p className="text-gray-500 dark:text-gray-400">No upcoming birthdays in the next 30 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map(contact => {
                  const daysUntil = getDaysUntilBirthday(contact.birthday);
                  const isThisWeek = daysUntil <= 7;
                  
                  return (
                    <div key={contact.id} className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      isThisWeek 
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${
                            isThisWeek 
                              ? 'text-orange-900 dark:text-orange-100' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <p className={`text-sm ${
                            isThisWeek 
                              ? 'text-orange-700 dark:text-orange-300' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {contact.company} • Owner: {contact.ownerName}
                          </p>
                          <p className={`text-xs mt-1 ${
                            isThisWeek 
                              ? 'text-orange-600 dark:text-orange-400' 
                              : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            Born: {formatBirthdayDate(contact.birthday)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl mb-1">
                            {isThisWeek ? '🎊' : '🎂'}
                          </div>
                          <span className={`text-sm font-semibold ${
                            isThisWeek 
                              ? 'text-orange-600 dark:text-orange-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1 Month Advance Birthdays */}
          {oneMonthAdvanceBirthdays.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  1 Month Advance Birthdays
                </h3>
              </div>
              
              <div className="space-y-3">
                {oneMonthAdvanceBirthdays.map(contact => {
                  const daysUntil = getDaysUntilBirthday(contact.birthday);
                  
                  return (
                    <div key={contact.id} className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            {contact.company} • Owner: {contact.ownerName}
                          </p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            Born: {formatBirthdayDate(contact.birthday)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl mb-1">📅</div>
                          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {daysUntil} days
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collaborative Birthdays (30-60 days advance) */}
          {collaborativeBirthdays.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-lg">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Collaborative Birthdays (1 Month Advance)
                </h3>
              </div>
              
              <div className="space-y-3">
                {collaborativeBirthdays.map(contact => {
                  const daysUntil = getDaysUntilBirthday(contact.birthday);
                  
                  return (
                    <div key={contact.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 dark:text-green-100">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {contact.company} • Owner: {contact.ownerName}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Born: {formatBirthdayDate(contact.birthday)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl mb-1">🎈</div>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collaborative Birthdays Information */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-lg">
                <Users className="w-4 h-4 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Collaborative Birthdays Summary
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Birthdays Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">My Contacts</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Today:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {personalBirthdays.filter(c => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const birthDate = new Date(c.birthday);
                        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                        return thisYearBirthday.getTime() === today.getTime();
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Next 30 days:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {personalBirthdays.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collaborative Birthdays Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">All Team Contacts</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Today:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {todayBirthdays.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">1 Month Advance:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {collaborativeBirthdays.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Contact Owners by 1 Month Advance Birthdays */}
            {collaborativeBirthdays.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  1 Month Advance Birthdays by Contact Owner:
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const ownerCounts = collaborativeBirthdays.reduce((acc, contact) => {
                      const owner = contact.ownerName || 'Unknown';
                      acc[owner] = (acc[owner] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    
                    return Object.entries(ownerCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([owner, count]) => (
                        <div key={owner} className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{owner}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {count} birthday{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BirthdayBox: React.FC<BirthdayBoxProps> = ({ contacts, currentUserId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayBirthdays, setTodayBirthdays] = useState<Contact[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Contact[]>([]);
  const [oneMonthAdvanceBirthdays, setOneMonthAdvanceBirthdays] = useState<Contact[]>([]);
  const [collaborativeBirthdays, setCollaborativeBirthdays] = useState<Contact[]>([]);
  const [personalBirthdays, setPersonalBirthdays] = useState<Contact[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    // Date ranges for different birthday categories
    const oneMonthFromNow = new Date(today);
    oneMonthFromNow.setDate(today.getDate() + 30);
    const twoMonthsFromNow = new Date(today);
    twoMonthsFromNow.setDate(today.getDate() + 60);

    // Helper function to parse birthday consistently with validation
    const parseBirthday = (birthday: string) => {
      if (!birthday || typeof birthday !== 'string') return null;
      
      const parts = birthday.split('-');
      if (parts.length !== 3) return null;
      
      const [year, month, day] = parts.map(Number);
      
      // Validate date components
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      if (year < 1900 || year > new Date().getFullYear() + 10) return null;
      
      return { year, month: month - 1, day }; // month is 0-indexed in JS Date
    };

    // Today's birthdays (all contacts)
    const todaysBirthdays = contacts.filter(contact => {
      if (!contact.birthday) return false;
      const parsed = parseBirthday(contact.birthday);
      if (!parsed) return false;
      
      const { month, day } = parsed;
      const thisYearBirthday = new Date(today.getFullYear(), month, day);
      thisYearBirthday.setHours(0, 0, 0, 0);
      return thisYearBirthday.getTime() === today.getTime();
    });

    // Upcoming birthdays (next 30 days, excluding today) - all contacts
    const upcoming = contacts.filter(contact => {
      if (!contact.birthday) return false;
      const parsed = parseBirthday(contact.birthday);
      if (!parsed) return false;
      
      const { month, day } = parsed;
      const thisYearBirthday = new Date(today.getFullYear(), month, day);
      thisYearBirthday.setHours(0, 0, 0, 0);
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      return thisYearBirthday > today && thisYearBirthday <= thirtyDaysFromNow;
    }).sort((a, b) => {
      const aData = parseBirthday(a.birthday);
      const bData = parseBirthday(b.birthday);
      if (!aData || !bData) return 0;
      
      const thisYear = today.getFullYear();
      
      const aBirthday = new Date(thisYear, aData.month, aData.day);
      const bBirthday = new Date(thisYear, bData.month, bData.day);
      
      aBirthday.setHours(0, 0, 0, 0);
      bBirthday.setHours(0, 0, 0, 0);
      
      if (aBirthday < today) aBirthday.setFullYear(thisYear + 1);
      if (bBirthday < today) bBirthday.setFullYear(thisYear + 1);
      
      return aBirthday.getTime() - bBirthday.getTime();
    });

    // Personal upcoming birthdays (user's contacts only)
    const personalUpcoming = upcoming.filter(contact => contact.ownerId === currentUserId);
    
    // 1 Month Advance Birthdays (30-60 days from today) - all contacts
    const oneMonthAdvance = contacts.filter(contact => {
      if (!contact.birthday) return false;
      const parsed = parseBirthday(contact.birthday);
      if (!parsed) return false;
      
      const { month, day } = parsed;
      const thisYearBirthday = new Date(today.getFullYear(), month, day);
      thisYearBirthday.setHours(0, 0, 0, 0);
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      // Check if birthday is between 30-60 days from today
      return thisYearBirthday > oneMonthFromNow && thisYearBirthday <= twoMonthsFromNow;
    }).sort((a, b) => {
      const aData = parseBirthday(a.birthday);
      const bData = parseBirthday(b.birthday);
      if (!aData || !bData) return 0;
      
      const thisYear = today.getFullYear();
      
      const aBirthday = new Date(thisYear, aData.month, aData.day);
      const bBirthday = new Date(thisYear, bData.month, bData.day);
      
      aBirthday.setHours(0, 0, 0, 0);
      bBirthday.setHours(0, 0, 0, 0);
      
      if (aBirthday < today) aBirthday.setFullYear(thisYear + 1);
      if (bBirthday < today) bBirthday.setFullYear(thisYear + 1);
      
      return aBirthday.getTime() - bBirthday.getTime();
    });
    
    // Collaborative birthdays (30-60 days advance notice for non-personal contacts)
    const collaborativeUpcoming = contacts
      .filter(contact => contact.ownerId !== currentUserId) // Only collaborative contacts (not owned by current user)
      .filter(contact => {
        if (!contact.birthday) return false;
        const parsed = parseBirthday(contact.birthday);
        if (!parsed) return false;
        
        const { month, day } = parsed;
        const thisYearBirthday = new Date(today.getFullYear(), month, day);
        thisYearBirthday.setHours(0, 0, 0, 0);
        
        // If birthday already passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        // Check if birthday is between 30-60 days from today (1 month advance notice)
        return thisYearBirthday > oneMonthFromNow && thisYearBirthday <= twoMonthsFromNow;
      })
      .sort((a, b) => {
        const aData = parseBirthday(a.birthday);
        const bData = parseBirthday(b.birthday);
        if (!aData || !bData) return 0;
        
        const thisYear = today.getFullYear();
        
        const aBirthday = new Date(thisYear, aData.month, aData.day);
        const bBirthday = new Date(thisYear, bData.month, bData.day);
        
        aBirthday.setHours(0, 0, 0, 0);
        bBirthday.setHours(0, 0, 0, 0);
        
        if (aBirthday < today) aBirthday.setFullYear(thisYear + 1);
        if (bBirthday < today) bBirthday.setFullYear(thisYear + 1);
        
        return aBirthday.getTime() - bBirthday.getTime();
      });

    setTodayBirthdays(todaysBirthdays);
    setUpcomingBirthdays(upcoming);
    setOneMonthAdvanceBirthdays(oneMonthAdvance);
    setCollaborativeBirthdays(collaborativeUpcoming);
    setPersonalBirthdays(personalUpcoming);

    // Debug logging
    console.log(`BirthdayBox calculations:
      - Total contacts: ${contacts.length}
      - Today's birthdays: ${todaysBirthdays.length}
      - Upcoming birthdays (0-30 days): ${upcoming.length}
      - 1 Month Advance birthdays (30-60 days): ${oneMonthAdvance.length}
      - Personal birthdays: ${personalUpcoming.length}
      - Collaborative birthdays (30-60 days): ${collaborativeUpcoming.length}`);
    
    if (collaborativeUpcoming.length > 0) {
      console.log('Collaborative birthdays:', collaborativeUpcoming.map(c => 
        `${c.firstName} ${c.lastName} (Owner: ${c.ownerName}, Birthday: ${c.birthday})`
      ));
    }
  }, [contacts, currentUserId]);

  const totalBirthdays = todayBirthdays.length + upcomingBirthdays.length;
  const totalAdvanceBirthdays = totalBirthdays + oneMonthAdvanceBirthdays.length;

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700 p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <Gift className="w-8 h-8 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Birthdays</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {todayBirthdays.length > 0 
                  ? `${todayBirthdays.length} today • ${upcomingBirthdays.length} upcoming • ${oneMonthAdvanceBirthdays.length} advance`
                  : totalBirthdays > 0 
                    ? `${totalBirthdays} upcoming • ${oneMonthAdvanceBirthdays.length} advance`
                    : oneMonthAdvanceBirthdays.length > 0 
                      ? `${oneMonthAdvanceBirthdays.length} advance birthdays`
                      : 'No upcoming birthdays'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {todayBirthdays.length > 0 && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">{todayBirthdays.length} Today!</span>
              </div>
            )}
            
            {todayBirthdays.length === 0 && upcomingBirthdays.length === 0 && oneMonthAdvanceBirthdays.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm font-semibold">{oneMonthAdvanceBirthdays.length} Advance</span>
              </div>
            )}
            
            <div className="text-2xl">
              {todayBirthdays.length > 0 ? '🎉' : totalBirthdays > 0 ? '🎂' : oneMonthAdvanceBirthdays.length > 0 ? '📅' : '🎈'}
            </div>
            
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Quick preview of next few birthdays */}
        {upcomingBirthdays.length > 0 && (
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
              <Calendar className="w-3 h-3" />
              <span>Next few birthdays:</span>
            </div>
            <div className="space-y-1">
              {upcomingBirthdays.slice(0, 3).map(contact => {
                const daysUntil = getDaysUntilBirthday(contact.birthday);
                return (
                  <div key={contact.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {contact.firstName} {contact.lastName}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium text-xs">
                      {daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                    </span>
                  </div>
                );
              })}
              {upcomingBirthdays.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-500 text-center pt-1">
                  +{upcomingBirthdays.length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BirthdayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        todayBirthdays={todayBirthdays}
        upcomingBirthdays={upcomingBirthdays}
        oneMonthAdvanceBirthdays={oneMonthAdvanceBirthdays}
        collaborativeBirthdays={collaborativeBirthdays}
        personalBirthdays={personalBirthdays}
      />
    </>
  );
};