'use client'
import { useState } from 'react'
import { Button, Switch } from 'antd';
import Head from 'next/head'
import Link from 'next/link'

// Translation object for privacy page
const translations = {
  en: {
    pageTitle: 'Privacy Policy & Terms of Use - MentorUp',
    pageDescription: 'Privacy Policy and Terms of Use for MentorUp platform',
    'Privacy Policy & Terms of Use': 'MentorUp Terms of Use and Privacy Policy',
    'Version': 'Version',
    'Effective Date': 'Effective Date',
    'Welcome': 'Welcome to MentorUp ("the Platform"). This Terms of Use and Privacy Policy ("this Policy") constitutes a legal agreement between you and MentorUp regarding the rules for using the platform and the handling of your personal data.',
    'Agreement': 'By registering, logging in, or using the Platform, you acknowledge that you have read, understood, and agreed to be bound by the contents of this Policy.',
    'Information We Collect': 'Information We Collect',
    'Collect Title': 'In order to provide high-quality services and improve your user experience, we may collect the following information when you use our platform:',
    'Direct Info': 'Information you provide directly: such as your email address, username, career-related profile information, etc.;',
    'Auto Info': 'Automatically collected information: including device data, access logs, operation history, browsing behavior, etc.;',
    'Third Party Info': 'Information from third-party tools: we use services like Google Analytics to collect anonymized behavioral and usage data.',
    'Data Minimization': 'We adhere to the principle of data minimization, and only collect data necessary to support core functions and comply with applicable laws.',
    'How We Use Your Information': 'How We Use Your Information',
    'Use Title': 'Your personal data may be used for the following purposes:',
    'Use 1': 'Account registration and identity verification;',
    'Use 2': 'Providing, optimizing, and maintaining platform services;',
    'Use 3': 'Sending service-related notifications and platform updates;',
    'Use 4': 'Data analysis and product optimization based on anonymized data;',
    'Use 5': 'Marketing purposes in compliance with applicable laws and with your consent where required.',
    'Use Restriction': 'We will not use your information for purposes not disclosed in this Policy, nor share your information with third parties without proper authorization.',
    'Data Storage and Security': 'Data Storage and Security',
    'Storage Info': 'Your personal information is stored on third-party cloud servers located in the United States. We comply with applicable U.S. data protection laws, including but not limited to the California Consumer Privacy Act (CCPA), and implement reasonable security measures to prevent unauthorized access, use, or disclosure of your data.',
    'Security Measures': 'We apply appropriate technical and administrative safeguards, including access control and encrypted storage, to protect your data from unauthorized access, tampering, or loss.',
    'Sharing and Transfers': 'Sharing and Transfers to Third Parties',
    'Sharing Title': 'The Platform currently integrates third-party analytics tools such as Google Analytics. These tools may, with your consent where required, collect data necessary for behavioral analysis and product improvement.',
    'Sharing Restriction': 'We do not disclose personally identifiable information to any third party without your explicit consent. If data sharing becomes necessary for business operations in the future, we will comply with applicable U.S. privacy laws (e.g., CCPA), and prioritize data anonymization, de-identification, or aggregation. Shared data will be limited in scope and purpose.',
    'Your Rights': 'Your Rights',
    'Rights Title': 'You have the right to:',
    'Right 1': 'Access, correct, or delete your personal data;',
    'Right 2': 'Deactivate or delete your account;',
    'Right 3': 'Withdraw consent or opt out of certain data uses (which may affect service functionality);',
    'Right 4': 'Request details about our data processing practices.',
    'Contact Rights': 'To exercise these rights, please contact us at:',
    'Policy Updates': 'Policy Updates and Notifications',
    'Update Info': 'If this Policy is updated, we will notify you via the Platform homepage, product interface, or email.',
    'Update Agreement': 'If you do not agree with the revised policy, you may choose to stop using our services. Continued use of the Platform after updates indicates your acceptance of the revised Policy.',
    'Scope and Governing Law': 'Scope and Governing Law',
    'Scope Info': 'This Policy applies to all products and services provided by MentorUp, including but not limited to the website, mobile applications, and any affiliated platforms.',
    'Governing Law': 'This Policy is governed by the laws of the United States. In the event of a dispute, we encourage users to resolve the matter through amicable negotiation. If such efforts fail, any dispute shall be submitted to the competent courts in the jurisdiction where MentorUp is registered.',
    'Additional Notes': 'Additional Notes',
    'Questions': 'If you have any questions about this Policy, please feel free to contact us at the email address above.',
    'Final Rights': 'MentorUp reserves the final right of interpretation for this Policy.',
    'Back to Home': 'Back to Home',
    'Contact Us': 'Contact Us',
  },
  zh: {
    pageTitle: '隐私政策和使用条款 - MentorUp',
    pageDescription: 'MentorUp平台的隐私政策和使用条款',
    'Privacy Policy & Terms of Use': 'MentorUp 用户条款与隐私政策',
    'Version': '版本号',
    'Effective Date': '生效日期',
    'Welcome': '欢迎您使用 MentorUp（以下简称"本平台"）提供的产品与服务。本《用户条款与隐私政策》（以下简称"本政策"）系您与本平台之间关于平台使用规则、用户个人信息保护等方面的法律协议，请您在使用平台前务必仔细阅读。',
    'Agreement': '一经您注册、登录、使用本平台服务，即视为您已阅读、理解并同意接受本政策的全部内容。',
    'Information We Collect': '信息收集说明',
    'Collect Title': '为保障服务质量及优化用户体验，我们在您使用平台过程中可能会收集如下信息：',
    'Direct Info': '您主动提供的信息：包括但不限于邮箱、用户名、职业资料等注册信息；',
    'Auto Info': '自动采集的信息：包括设备信息、访问记录、操作日志、浏览行为等；',
    'Third Party Info': '第三方收集信息：我们使用 Google Analytics 等第三方统计工具收集使用行为数据。',
    'Data Minimization': '我们遵循"数据最小化"原则，仅收集实现核心功能与合法合规经营所必需的数据。',
    'How We Use Your Information': '信息使用目的',
    'Use Title': '您的个人信息可能被用于以下用途：',
    'Use 1': '用户注册与身份验证；',
    'Use 2': '服务功能的提供、优化与维护；',
    'Use 3': '推送平台相关的运营信息与更新通知；',
    'Use 4': '经匿名化处理的数据分析与产品运营；',
    'Use 5': '在符合法律法规的前提下，用于市场推广活动。',
    'Use Restriction': '我们不会将您的信息用于本政策未载明的目的，亦不会未经授权擅自向第三方披露。',
    'Data Storage and Security': '信息存储与安全保障',
    'Storage Info': '您的个人信息将被保存在我们所使用的第三方云服务器中，服务器目前部署于美国。我们将根据适用的美国法律（包括但不限于加州《消费者隐私法案 CCPA》）采取合理的安全措施，防止数据未经授权的访问、使用或披露。',
    'Security Measures': '我们采取合理可行的技术手段与管理措施（如访问权限控制、加密存储等）保护您的数据安全，防止数据被泄露、篡改、损毁或未经授权访问。',
    'Sharing and Transfers': '第三方共享与转移',
    'Sharing Title': '本平台目前集成了 Google Analytics 等第三方数据服务工具。该类服务可能会在获得用户授权后收集必要的数据用于分析与产品优化。',
    'Sharing Restriction': '我们不会在未经用户明确授权的情况下向任何第三方披露可识别个人身份的信息。未来如因业务发展需要与第三方共享数据，我们将严格遵守适用的美国隐私法律（如 CCPA），并优先使用脱敏、去标识化或匿名化技术进行处理，限制使用范围与目的。',
    'Your Rights': '用户权利',
    'Rights Title': '用户享有以下权利：',
    'Right 1': '访问、更正或删除您提供的个人信息；',
    'Right 2': '注销您的账号；',
    'Right 3': '撤回授权或拒绝某些数据用途（该行为可能影响部分服务功能）；',
    'Right 4': '获取有关我们数据处理活动的说明。',
    'Contact Rights': '如您需要行使上述权利，可通过如下方式与我们联系：',
    'Policy Updates': '政策变更与通知',
    'Update Info': '本政策内容如发生变更，我们将在平台首页、产品页面或以电子邮件等形式向您发出通知。',
    'Update Agreement': '若您不同意更新后的政策内容，您有权停止使用平台服务。若您继续使用，视为接受修订内容。',
    'Scope and Governing Law': '适用范围与法律适用',
    'Scope Info': '本政策适用于 MentorUp 提供的全部产品与服务，包括但不限于网站、移动应用、小程序等。',
    'Governing Law': '本政策适用美国法律。在出现分歧时，我们将尽力通过合理、友好的方式与用户沟通解决。如确有需要，争议将由 MentorUp 注册地法院管辖。',
    'Additional Notes': '附注说明',
    'Questions': '如对本政策内容有任何疑问，请通过邮箱与我们联系。',
    'Final Rights': '本政策的最终解释权归 MentorUp 所有。',
    'Back to Home': '返回首页',
    'Contact Us': '联系我们',
  }
}

export default function PrivacyPage() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en')

  // Custom translation function
  const t = (key: string) => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  // Custom i18n object
  const i18n = {
    language,
    changeLanguage: (newLang: 'en' | 'zh') => {
      setLanguage(newLang)
    }
  }

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(nextLang)
  }

  return (
    <>
      <Head>
        <title>{t('pageTitle')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={t('pageDescription')} />
      </Head>

      <main className="min-h-screen bg-white">

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Language Switch and Back to Home Button */}
          <div className="flex justify-between items-center mb-6">
            <Link href="/">
              <Button type="default">
                ← {t('Back to Home')}
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{i18n.language === 'zh' ? '中文' : 'English'}</span>
              <Switch
                checked={i18n.language === 'zh'}
                onChange={toggleLanguage}
              />
              <span>{i18n.language === 'zh' ? '中文' : 'Eng'}</span>
            </div>
          </div>

          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
              {t('Privacy Policy & Terms of Use')}
            </h1>
            <div className="text-gray-600 space-y-1">
              <p>{t('Version')}: v1.0</p>
              <p>{t('Effective Date')}: June 1, 2025</p>
            </div>
          </div>

          {/* Welcome Section */}
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('Welcome')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('Agreement')}
            </p>
          </section>

          {/* Information We Collect Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">1. {t('Information We Collect')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Collect Title')}
              </p>
              <div className="ml-6 space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  (1) {t('Direct Info')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (2) {t('Auto Info')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (3) {t('Third Party Info')}
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t('Data Minimization')}
              </p>
            </div>
          </section>

          {/* How We Use Your Information Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">2. {t('How We Use Your Information')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Use Title')}
              </p>
              <div className="ml-6 space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  (1) {t('Use 1')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (2) {t('Use 2')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (3) {t('Use 3')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (4) {t('Use 4')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (5) {t('Use 5')}
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t('Use Restriction')}
              </p>
            </div>
          </section>

          {/* Data Storage and Security Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">3. {t('Data Storage and Security')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Storage Info')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('Security Measures')}
              </p>
            </div>
          </section>

          {/* Sharing and Transfers Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">4. {t('Sharing and Transfers')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Sharing Title')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('Sharing Restriction')}
              </p>
            </div>
          </section>

          {/* Your Rights Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">5. {t('Your Rights')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Rights Title')}
              </p>
              <div className="ml-6 space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  (1) {t('Right 1')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (2) {t('Right 2')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (3) {t('Right 3')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (4) {t('Right 4')}
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t('Contact Rights')}
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                📧 contactus@mentorup.info
              </p>
            </div>
          </section>

          {/* Policy Updates Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">6. {t('Policy Updates')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Update Info')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('Update Agreement')}
              </p>
            </div>
          </section>

          {/* Scope and Governing Law Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">7. {t('Scope and Governing Law')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Scope Info')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('Governing Law')}
              </p>
            </div>
          </section>

          {/* Additional Notes Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">{t('Additional Notes')}</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {t('Questions')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('Final Rights')}
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  )
} 