import type { Locale } from './locales'

const en = {
  'nav.members': 'MEMBERS',
  'nav.projects': 'PROJECTS',
  'nav.support': 'SUPPORT',
  'nav.news': 'NEWS',
  'nav.about': 'ABOUT',
  'nav.contact': 'CONTACT',

  current: 'CURRENT',

  'language.en': 'EN',
  'language.el': 'ΕΛ',
  'language.label': 'Language',

  'a11y.skipToContent': 'Skip to content',

  'staging.label': 'STAGING — not the public site',

  'form.name': 'Name',
  'form.email': 'Email',
  'form.phone': 'Phone',
  'form.tier': 'Membership tier',
  'form.tierUnsure': 'Not sure yet',
  'form.practice': 'Practice',
  'form.message': 'Message',
  'form.cv': 'CV',
  'form.cvNote': 'PDF, DOC or DOCX, up to 4 MB.',
  'form.consent': 'I agree to the privacy notice',
  'form.submit': 'Send application',
  'form.sendMessage': 'Send message',
  'form.success': 'Thank you — your application has been sent.',
  'form.contactSuccess': 'Thank you — your message has been sent.',
  'form.error': 'Something went wrong. Please try again.',

  'form.errors.required': 'This field is required',
  'form.errors.invalid': 'Enter a valid value',
  'form.errors.name': 'Enter your name',
  'form.errors.email': 'Enter a valid email address',
  'form.errors.phone': 'Enter a valid phone number',
  'form.errors.tier': 'Choose a membership tier',
  'form.errors.message': 'Enter a message',
  'form.errors.consent': 'Please accept the privacy notice',
  'form.errors.cvTooLarge': 'Your CV must not be larger than 4 MB. Please email it to us instead.',
  'form.errors.cvUnsupported': 'Your CV must be a PDF, DOC or DOCX file.',

  'notFound.heading': '404 — Page not found',
  'notFound.body': 'The page you are looking for does not exist or has moved.',
  'notFound.home': 'Back to the home page',
} as const

export type UIKey = keyof typeof en

const el: Record<UIKey, string> = {
  'nav.members': 'ΜΕΛΗ',
  'nav.projects': 'ΕΡΓΑ',
  'nav.support': 'ΣΤΗΡΙΞΗ',
  'nav.news': 'ΝΕΑ',
  'nav.about': 'ΣΧΕΤΙΚΑ',
  'nav.contact': 'ΕΠΙΚΟΙΝΩΝΙΑ',

  current: 'ΤΩΡΑ',

  'language.en': 'EN',
  'language.el': 'ΕΛ',
  'language.label': 'Γλώσσα',

  'a11y.skipToContent': 'Μετάβαση στο περιεχόμενο',

  'staging.label': 'ΣΕ ΔΟΚΙΜΗ — όχι η δημόσια ιστοσελίδα',

  'form.name': 'Όνομα',
  'form.email': 'Ηλεκτρονικό ταχυδρομείο',
  'form.phone': 'Τηλέφωνο',
  'form.tier': 'Κατηγορία μέλους',
  'form.tierUnsure': 'Δεν έχω αποφασίσει ακόμη',
  'form.practice': 'Τομέας πρακτικής',
  'form.message': 'Μήνυμα',
  'form.cv': 'Βιογραφικό σημείωμα',
  'form.cvNote': 'PDF, DOC ή DOCX, έως 4 MB.',
  'form.consent': 'Συμφωνώ με τη δήλωση απορρήτου',
  'form.submit': 'Υποβολή',
  'form.sendMessage': 'Αποστολή μηνύματος',
  'form.success': 'Ευχαριστούμε — η αίτησή σας στάλθηκε.',
  'form.contactSuccess': 'Ευχαριστούμε — το μήνυμά σας στάλθηκε.',
  'form.error': 'Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.',

  'form.errors.required': 'Το πεδίο είναι υποχρεωτικό',
  'form.errors.invalid': 'Εισαγάγετε μια έγκυρη τιμή',
  'form.errors.name': 'Εισαγάγετε το όνομά σας',
  'form.errors.email': 'Εισαγάγετε μια έγκυρη διεύθυνση email',
  'form.errors.phone': 'Εισαγάγετε έναν έγκυρο αριθμό τηλεφώνου',
  'form.errors.tier': 'Επιλέξτε κατηγορία μέλους',
  'form.errors.message': 'Εισαγάγετε μήνυμα',
  'form.errors.consent': 'Παρακαλώ αποδεχτείτε τη δήλωση απορρήτου',
  'form.errors.cvTooLarge': 'Το βιογραφικό σας δεν πρέπει να είναι μεγαλύτερο από 4 MB. Παρακαλώ στείλτε το με email.',
  'form.errors.cvUnsupported': 'Το βιογραφικό πρέπει να είναι αρχείο PDF, DOC ή DOCX.',

  'notFound.heading': '404 — Η σελίδα δεν βρέθηκε',
  'notFound.body': 'Η σελίδα που αναζητάτε δεν υπάρχει ή έχει μετακινηθεί.',
  'notFound.home': 'Επιστροφή στην αρχική σελίδα',
}

export function t(key: UIKey, lang: Locale): string {
  return lang === 'el' ? el[key] : en[key]
}
