
import { Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen w-full justify-center bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-primary"
          >
            <Briefcase className="h-7 w-7" />
            RecruitTrack
          </Link>
        </div>
        <div className="prose prose-gray mx-auto dark:prose-invert">
            <h1>Terms of Service</h1>
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing or using the RecruitTrack platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use this Service. These Terms apply to all users, including administrators, HR personnel, managers, and candidates.
            </p>

            <h2>2. Description of Service</h2>
            <p>
                RecruitTrack is an internal hiring platform designed to streamline the recruitment process. The Service includes features for posting jobs, managing candidate applications, and utilizing artificial intelligence ("AI") to match resumes with job descriptions. The Service is intended for internal company use only.
            </p>

            <h2>3. User Accounts and Responsibilities</h2>
            <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must not use the Service for any illegal or unauthorized purpose. You agree to comply with all local laws regarding online conduct and acceptable content.
            </p>

            <h2>4. Use of AI Features</h2>
            <p>
                RecruitTrack uses AI to provide resume matching scores and analysis. These features are provided for informational and guidance purposes only. You acknowledge that AI-generated output may not always be accurate or complete. The ultimate hiring decisions rest solely with you, and you agree not to hold RecruitTrack liable for any decisions made based on the AI analysis.
            </p>

            <h2>5. Intellectual Property</h2>
            <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of RecruitTrack and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
            </p>

            <h2>6. Termination</h2>
            <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>

            <h2>7. Disclaimer of Warranties</h2>
            <p>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Your use of the Service is at your sole risk. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
                In no event shall RecruitTrack, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>

            <h2>9. Governing Law</h2>
            <p>
                These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which your company is headquartered, without regard to its conflict of law provisions.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
            </p>
            
            <h2>11. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@leorecruit.com">support@leorecruit.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
