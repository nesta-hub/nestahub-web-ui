import { Layout } from "@/components/layout";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="min-h-screen pb-24 md:pb-8">
        <div className="container px-4 py-8 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, such as when you create an account,
                make a purchase, or contact us. This may include your name, email address, shipping address,
                phone number, and payment information.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                If you choose to sign in using Google Sign-In, we receive limited information from your
                Google account, such as your name, email address, and profile picture.
                We do not access your Google password or any other Google account data.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                If you choose to sign in using Facebook Sign-In, we receive limited information from your
                Facebook account, such as your name, email address, and profile picture.
                We do not access your Facebook password or any other Facebook account data.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                We also collect certain information automatically when you use our platform, such as your
                IP address, browser type, device information, and pages visited. This helps us understand
                how our platform is used and improve the experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-muted-foreground leading-relaxed">
                <li>Process and fulfil your orders and subscriptions</li>
                <li>Communicate with you about your orders, products, and services</li>
                <li>Personalise your experience and product recommendations</li>
                <li>Improve and develop our platform</li>
                <li>Send promotional communications, where you have consented (you may opt out at any time)</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Information obtained through Google or Facebook Sign-In is used solely for authentication
                and account management purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do not sell or rent your personal information to third parties. We may share your
                information with trusted service providers who assist us in operating our platform,
                processing payments, and delivering products. These partners are contractually bound
                by confidentiality obligations and may only use your information as directed by us.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                We may also disclose your information when required by law or to protect the rights,
                property, or safety of Nesta Hub, our customers, or others.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Cookies and Session Data</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to maintain secure user sessions, enable
                authentication, remember your preferences, and improve site functionality. Essential
                cookies are required for the platform to function. You can control non-essential cookie
                preferences through your browser settings, though disabling certain cookies may affect
                your experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as needed
                to provide you with our services. We will also retain and use your information as necessary
                to comply with legal obligations, resolve disputes, and enforce our agreements. If you
                request deletion of your account, we will delete or anonymise your personal data within
                a reasonable time, unless retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement appropriate technical and organisational measures to protect your personal
                information against unauthorised access, alteration, disclosure, or destruction. However,
                no method of transmission over the internet is 100% secure. We encourage you to use a
                strong, unique password for your account and to keep it confidential.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our platform is intended for use by adults. We do not knowingly collect personal
                information from children under the age of 13. If you believe we have inadvertently
                collected information from a child, please contact us immediately and we will take
                steps to delete that information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have the right to access, update, or delete your personal information. You may
                request account or data deletion at any time by contacting us at{' '}
                <a href="mailto:privacy@nestahub.ng" className="underline hover:text-foreground transition-colors">
                  privacy@nestahub.ng
                </a>
                . We will process deletion requests in accordance with applicable laws.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                You may also request a copy of the personal data we hold about you, or ask us to
                correct any inaccuracies. To make such a request, please reach out via the contact
                details below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. When we do, we will revise the
                "Last updated" date at the top of this page. We encourage you to review this policy
                periodically. Continued use of our platform after any changes constitutes your
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have any questions or concerns about this Privacy Policy or how we handle your
                personal information, please contact us through our{' '}
                <a href="/contact" className="underline hover:text-foreground transition-colors">
                  Contact page
                </a>{' '}
                or email us at{' '}
                <a href="mailto:privacy@nestahub.ng" className="underline hover:text-foreground transition-colors">
                  privacy@nestahub.ng
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
