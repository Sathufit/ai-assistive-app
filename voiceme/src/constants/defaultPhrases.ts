export interface Phrase {
  id: string;
  sinhala: string;
  english: string;
}

export const DEFAULT_PHRASES: Phrase[] = [
  { id: '1', sinhala: 'ඔව්', english: 'Yes' },
  { id: '2', sinhala: 'නැහැ', english: 'No' },
  { id: '3', sinhala: 'ස්තූතියි', english: 'Thank you' },
  { id: '4', sinhala: 'හොඳයි, ස්තූතියි', english: "I'm okay, thank you" },
  { id: '5', sinhala: 'මට වතුර ඕනේ', english: 'I need water' },
  { id: '6', sinhala: 'මට කෑම ඕනේ', english: 'I need food' },
  { id: '7', sinhala: 'මට වේදනාවක් තිබේ', english: 'I am in pain' },
  { id: '8', sinhala: 'ටෙලිවිශනය off කරන්න', english: 'Turn off the TV' },
  { id: '9', sinhala: 'ලයිට් නිවන්න', english: 'Turn off the light' },
  { id: '10', sinhala: 'කරුණාකර ළඟ ඉන්න', english: 'Please stay with me' },
  { id: '11', sinhala: 'ඩොක්ටර් කැඳවන්න', english: 'Call the doctor' },
  { id: '12', sinhala: 'මට විවේකය ඕනේ', english: 'I need to rest' },
];
