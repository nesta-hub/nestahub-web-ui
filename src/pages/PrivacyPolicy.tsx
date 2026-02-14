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
              <p className="text-sm text-muted-foreground leading-relaxed">
               If you choose to sign in using Google Sign-In, we receive limited information from your 
                Google account, such as your name, email address, and profile picture. 
                We do not access your Google password or any other Google account data.
              </p>
               <p className="text-sm text-muted-foreground leading-relaxed">
                If you choose to sign in using Facebook Sign-In, we receive limited information from your 
                Google account, such as your name, email address, and profile picture. 
                We do not access your Google password or any other Google account data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use the information we collect to process orders, communicate with you about products
                and services, personalise your experience, and improve our platform. We may also use your
                information to send promotional communications with your consent and you may opt out at any time.
                Information obtained through Google/Facebook Sign-In is used solely for authentication and account management.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do not sell or rent your personal information. We may share your information with trusted
                third-party service providers who assist us in operating our platform, processing payments,
                and delivering products. These partners are bound by confidentiality obligations.
              </p>
            </section>
           <section>
              <h2 className="text-xl font-semibold mb-3">4. Cookies and Session Data </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
         We use cookies and similar technologies to maintain secure user sessions, enable authentication, and improve site functionality. 
         You can control cookie preferences through your browser settings.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement appropriate technical and organisational measures to protect your personal
                information against unauthorised access, alteration, disclosure, or destruction. However,
                no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have the right to access, update, or delete your personal information.You may request account or data deletion at any time by contacting us at privacy@nestahub.com. We will process deletion requests in accordance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our
                Contact page or email us at privacy@nestahub.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
