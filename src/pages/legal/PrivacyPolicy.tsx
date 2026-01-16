import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Cookie, Eye, Lock, Share2, UserX, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "January 16, 2026";
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-8 max-w-4xl">
        <AppBreadcrumb className="mb-4" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>

        <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              At BetSmart Playbook Pro, we are committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              sports analytics platform.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4>1.1 Information You Provide</h4>
              <ul>
                <li><strong>Account Information:</strong> Email address, username, and password when you create an account</li>
                <li><strong>Profile Data:</strong> Optional profile information such as display name and preferences</li>
                <li><strong>Betting Records:</strong> If you use our tracking features, your manually entered bet history</li>
                <li><strong>Communications:</strong> Messages you send to us through support channels</li>
              </ul>
              
              <h4>1.2 Information Collected Automatically</h4>
              <ul>
                <li><strong>Usage Data:</strong> Pages visited, features used, and time spent on the platform</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
                <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
                <li><strong>Cookies:</strong> Small data files stored on your device for functionality and analytics</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>We use the collected information for the following purposes:</p>
              <ul>
                <li>To provide and maintain our Service</li>
                <li>To personalize your experience and remember your preferences</li>
                <li>To improve our algorithms and analytics features</li>
                <li>To communicate with you about updates and new features</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
              <p className="font-medium text-primary">
                We do NOT sell your personal information to third parties.
              </p>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                3. Information Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>We may share your information only in the following circumstances:</p>
              <ul>
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law, subpoena, or government request</li>
                <li><strong>Protection:</strong> To protect our rights, privacy, safety, or property</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p>
                Any third-party service providers are contractually obligated to protect your information 
                and use it only for the purposes we specify.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                4. Cookies and Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>We use cookies and similar technologies to:</p>
              <ul>
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze how you use our platform</li>
                <li>Improve our services based on usage patterns</li>
              </ul>
              <p>
                You can control cookies through your browser settings. However, disabling cookies may 
                limit your ability to use certain features of the Service.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                5. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul>
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication</li>
              </ul>
              <p>
                However, no method of transmission over the Internet is 100% secure. While we strive 
                to protect your information, we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-primary" />
                6. Your Rights and Choices
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>You have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at the email address below.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>7. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Our Service is not intended for individuals under 18 years of age. We do not knowingly 
                collect personal information from children. If you become aware that a child has provided 
                us with personal information, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* International Users */}
          <Card>
            <CardHeader>
              <CardTitle>8. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your information in accordance 
                with this Privacy Policy and applicable data protection laws.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                9. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="font-medium">privacy@betsmartplaybook.com</p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <PageFooter />
    </div>
  );
}
