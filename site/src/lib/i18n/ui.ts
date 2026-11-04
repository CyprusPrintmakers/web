import type { Locale } from './locales'

const en = {
  'nav.members': 'MEMBERS',
  'nav.projects': 'PROJECTS',
  'nav.support': 'SUPPORT',
  'nav.news': 'NEWS',
  'nav.about': 'ABOUT',
  'nav.contact': 'CONTACT',

  current: 'CURRENT',

  'home.enter': 'Enter the Cyprus Printmakers Association website',

  'language.en': 'EN',
  'language.el': 'ΕΛ',
  'language.label': 'Language',

  'a11y.skipToContent': 'Skip to content',

  'staging.label': 'STAGING — not the public site',

  'members.heading': 'Members',
  'members.committee': 'Committee',
  'members.search': 'Search members',
  'members.countOne': '{n} member',
  'members.countMany': '{n} members',
  'members.directory': 'All members',
  'members.email': 'Email',
  'members.website': 'Website',
  'members.instagram': 'Instagram',
  'members.joined': 'Joined {n}',

  'projects.heading': 'Projects',
  'projects.allYears': 'All years',
  'projects.years': 'Filter by year',
  'projects.gallery': 'Gallery',
  'projects.participants': 'Participants',
  'projects.venue': 'Venue',
  'projects.dates': 'Dates',
  'projects.links': 'Links',

  'news.heading': 'News',
  'news.related': 'Related project',

  'membership.heading': 'Membership',
  'membership.support': 'Support us',
  'membership.gatedNotice': 'Membership terms to be confirmed',
  'membership.back': 'Become a member',
  'membership.form': 'Apply for membership',
  'membership.formSoon': 'The application form will be available here soon.',

  'form.name': 'Name',
  'form.fullName': 'Full name',
  'form.mobile': 'Mobile number',
  'form.why': 'Why do you want to become a member?',
  'form.cvAction': 'Send us your CV',
  'form.requiredNote': 'Fields marked * are required',
  'form.email': 'Email',
  'form.phone': 'Phone',
  'form.tier': 'Membership tier',
  'form.tierUnsure': 'Not sure yet',
  'form.practice': 'Practice',
  'form.message': 'Message',
  'form.cv': 'CV',
  'form.cvNote': 'PDF, DOC or DOCX, up to 4 MB.',
  'form.consent': 'I agree to the privacy notice',
  'form.privacyHeading': 'Privacy notice',
  'form.submit': 'Submit',
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
  'form.errors.why': 'Tell us why you want to join',
  'form.errors.cvRequired': 'Attach your CV',
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

  'home.enter': 'Είσοδος στον ιστότοπο του Συλλόγου Χαρακτών Κύπρου',

  'language.en': 'EN',
  'language.el': 'ΕΛ',
  'language.label': 'Γλώσσα',

  'a11y.skipToContent': 'Μετάβαση στο περιεχόμενο',

  'staging.label': 'ΣΕ ΔΟΚΙΜΗ — όχι η δημόσια ιστοσελίδα',

  'members.heading': 'Μέλη',
  'members.committee': 'Επιτροπή',
  'members.search': 'Αναζήτηση μελών',
  'members.countOne': '{n} μέλος',
  'members.countMany': '{n} μέλη',
  'members.directory': 'Όλα τα μέλη',
  'members.email': 'Ηλεκτρονικό ταχυδρομείο',
  'members.website': 'Ιστοσελίδα',
  'members.instagram': 'Instagram',
  'members.joined': 'Μέλος από {n}',

  'projects.heading': 'Έργα',
  'projects.allYears': 'Όλα τα έτη',
  'projects.years': 'Φίλτρο έτους',
  'projects.gallery': 'Συλλογή',
  'projects.participants': 'Συμμετέχοντες',
  'projects.venue': 'Χώρος',
  'projects.dates': 'Ημερομηνίες',
  'projects.links': 'Σύνδεσμοι',

  'news.heading': 'Νέα',
  'news.related': 'Σχετικό έργο',

  'membership.heading': 'Συνδρομή',
  'membership.support': 'Υποστηρίξτε μας',
  'membership.gatedNotice': 'Οι όροι μέλους προς επιβεβαίωση',
  'membership.back': 'Γίνετε μέλος',
  'membership.form': 'Αίτηση για μέλος',
  'membership.formSoon': 'Η φόρμα αίτησης θα είναι σύντομα διαθέσιμη εδώ.',

  'form.name': 'Όνομα',
  'form.fullName': 'Ονοματεπώνυμο',
  'form.mobile': 'Κινητό τηλέφωνο',
  'form.why': 'Γιατί θέλετε να γίνετε μέλος;',
  'form.cvAction': 'Στείλτε μας το βιογραφικό σας',
  'form.requiredNote': 'Τα πεδία με * είναι υποχρεωτικά',
  'form.email': 'Ηλεκτρονικό ταχυδρομείο',
  'form.phone': 'Τηλέφωνο',
  'form.tier': 'Κατηγορία μέλους',
  'form.tierUnsure': 'Δεν έχω αποφασίσει ακόμη',
  'form.practice': 'Τομέας πρακτικής',
  'form.message': 'Μήνυμα',
  'form.cv': 'Βιογραφικό σημείωμα',
  'form.cvNote': 'PDF, DOC ή DOCX, έως 4 MB.',
  'form.consent': 'Συμφωνώ με τη δήλωση απορρήτου',
  'form.privacyHeading': 'Δήλωση απορρήτου',
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
  'form.errors.why': 'Πείτε μας γιατί θέλετε να γίνετε μέλος',
  'form.errors.cvRequired': 'Επισυνάψτε το βιογραφικό σας',
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
