import React, { useState } from 'react';
import { FileText, Check, X } from 'lucide-react';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onDecline: () => void;
  userName: string;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ 
  onAccept, 
  onDecline, 
  userName 
}) => {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (hasReadTerms && hasScrolledToBottom) {
      onAccept();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="bg-black dark:bg-white p-3 sm:p-4 rounded-full">
            <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-white dark:text-black" />
          </div>
        </div>
        
        <h1 className="text-xl sm:text-3xl font-bold text-center text-black dark:text-white mb-1 sm:mb-2">
          Welcome, {userName}!
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-2">
          Please read and accept our Terms and Conditions to continue
        </p>
        
        <div 
          className="flex-1 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 bg-white dark:bg-black"
          onScroll={handleScroll}
        >
          <div className="prose prose-sm sm:prose max-w-none text-black dark:text-white">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Terms and Conditions</h2>
            
            <h3 className="text-base sm:text-lg font-medium mb-2">1. Acceptance of Terms</h3>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              By accessing and using the Contact Manager application, you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use this application.
            </p>

            <h3 className="text-base sm:text-lg font-medium mb-2">2. Use of the Application</h3>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              You may use this application to manage your personal and collaborative contacts. You are responsible for 
              maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h3 className="text-base sm:text-lg font-medium mb-2">3. Data Privacy and Protection</h3>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              We are committed to protecting your privacy. Contact information you enter into the system will be stored 
              securely and will only be accessible to authorized users within your organization. We will not share your 
              personal data with third parties without your explicit consent.
            </p>

            <h3 className="text-base sm:text-lg font-medium mb-2">4. User Responsibilities</h3>
            <p className="mb-2 sm:mb-4 text-sm sm:text-base">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside mb-3 sm:mb-4 ml-2 sm:ml-4 text-sm sm:text-base">
              <li>Providing accurate and up-to-date contact information</li>
              <li>Respecting the privacy of others whose information you manage</li>
              <li>Using the application only for legitimate business or personal purposes</li>
              <li>Reporting any security vulnerabilities or unauthorized access</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">5. Collaborative Features</h3>
            <p className="mb-4">
              When using collaborative features, your contact information may be visible to other users in your organization 
              based on your role and permissions. Please ensure you have appropriate consent before adding others' contact information.
            </p>

            <h3 className="text-lg font-medium mb-2">6. Data Export and Backup</h3>
            <p className="mb-4">
              You may export your contact data at any time using the provided export features. We recommend regular backups 
              of important contact information. While we strive to maintain data integrity, you are responsible for maintaining 
              your own backups.
            </p>

            <h3 className="text-lg font-medium mb-2">7. Prohibited Activities</h3>
            <p className="mb-4">
              You may not use this application to:
            </p>
            <ul className="list-disc list-inside mb-4 ml-4">
              <li>Store or distribute spam, malicious content, or illegal information</li>
              <li>Attempt to gain unauthorized access to other users' data</li>
              <li>Interfere with the application's normal operation</li>
              <li>Use automated tools to extract or manipulate data without permission</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">8. Limitation of Liability</h3>
            <p className="mb-4">
              This application is provided "as is" without warranties of any kind. We are not liable for any direct, 
              indirect, incidental, or consequential damages arising from your use of the application.
            </p>

            <h3 className="text-lg font-medium mb-2">9. Changes to Terms</h3>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Users will be notified of significant changes 
              and may be required to accept updated terms to continue using the application.
            </p>

            <h3 className="text-lg font-medium mb-2">10. Contact Information</h3>
            <p className="mb-4">
              If you have questions about these Terms and Conditions, please contact your system administrator or 
              support team.
            </p>

            <p className="text-sm text-gray-600 mt-8">
              Last updated: October 18, 2025
            </p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <input
              type="checkbox"
              id="readTerms"
              checked={hasReadTerms}
              onChange={(e) => setHasReadTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-black border-gray-400 rounded focus:ring-black dark:focus:ring-white"
              disabled={!hasScrolledToBottom}
            />
            <label htmlFor="readTerms" className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
              I have read and understood the Terms and Conditions
              {!hasScrolledToBottom && (
                <span className="text-gray-500 dark:text-gray-400 block sm:inline sm:ml-2 mt-1 sm:mt-0">(Please scroll to the bottom first)</span>
              )}
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0">
            <button
              onClick={handleAccept}
              disabled={!hasReadTerms || !hasScrolledToBottom}
              className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-3 px-4 rounded-lg font-semibold transition-all border text-sm sm:text-base ${
                hasReadTerms && hasScrolledToBottom
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600'
              }`}
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Accept and Continue</span>
            </button>
            
            <button
              onClick={onDecline}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3 px-4 border-2 border-black dark:border-white text-black dark:text-white rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-900 transition-all text-sm sm:text-base"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};