require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || './survey.db';

// Sample data pools
const ages = ['alle-18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const genders = ['mies', 'nainen', 'muu', 'en-halua-vastata'];
const educations = ['peruskoulu', 'toinen-aste', 'korkeakoulu'];
const occupations = [
  'Opiskelija',
  'Insinööri',
  'Myyjä',
  'Opettaja',
  'Lääkäri',
  'IT-asiantuntija',
  'Toimistotyöntekijä',
  'Eläkeläinen',
  'Yrittäjä',
  'Sairaanhoitaja'
];

const visitFrequencies = ['paivittain', 'viikoittain', 'kuukausittain', 'harvemmin'];

const infoSearchOptions = [
  'tuote',
  'palvelu',
  'liike',
  'aukioloaika',
  'tarjous-tietty',
  'tarjous-paras',
  'tapahtuma',
  'neuvonta',
  'oheispalvelu',
  'pysakointi'
];

const infoSourceOptions = [
  'nettisivut',
  'mobiilisovellus',
  'infonaytot',
  'asiakaspalvelu',
  'henkilokunta',
  'liike-nettisivut'
];

const aiServicesOptions = [
  'haku-tuote',
  'haku-liike',
  'paivan-tarjoukset',
  'raataloidyt-tarjoukset',
  'ruokalista',
  'ajanviete',
  'kartta'
];

const interfaceOptions = ['kosketusnaytto', 'aaniohjaus', 'kehonkieli', 'muu'];

// Helper function to get random items from array
function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to get random item
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate sample responses
function generateSampleData(count = 20) {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
    console.log(`Connected to database: ${DB_PATH}`);
  });

  const query = `INSERT INTO responses
    (age, gender, education, occupation, visit_frequency, info_search, info_search_other,
     info_source, info_source_other, ai_services, ai_services_other, interface_preference, interface_other)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  let insertedCount = 0;

  for (let i = 0; i < count; i++) {
    const age = getRandomItem(ages);
    const gender = getRandomItem(genders);
    const education = getRandomItem(educations);
    const occupation = getRandomItem(occupations);
    const visitFrequency = getRandomItem(visitFrequencies);
    const infoSearch = getRandomItems(infoSearchOptions, 5);
    const infoSource = getRandomItems(infoSourceOptions, Math.floor(Math.random() * 3) + 1); // 1-3 items
    const aiServices = getRandomItems(aiServicesOptions, 3);
    const interfacePreference = getRandomItem(interfaceOptions);

    db.run(
      query,
      [
        age,
        gender,
        education,
        occupation,
        visitFrequency,
        JSON.stringify(infoSearch),
        '',
        JSON.stringify(infoSource),
        '',
        JSON.stringify(aiServices),
        '',
        interfacePreference,
        ''
      ],
      function (err) {
        if (err) {
          console.error('Error inserting sample data:', err);
        } else {
          insertedCount++;
          console.log(`Inserted sample response ${insertedCount}/${count} (ID: ${this.lastID})`);

          if (insertedCount === count) {
            console.log(`\n✅ Successfully inserted ${count} sample responses!`);
            console.log(`\nYou can now view the dashboard with data at:`);
            console.log(`http://localhost:${process.env.PORT || 3000}/dashboard\n`);

            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
              } else {
                console.log('Database connection closed');
              }
              process.exit(0);
            });
          }
        }
      }
    );
  }
}

// Check if database exists and has tables
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.log('\n❌ Database not found. Please run the server first to create the database:');
    console.log('   npm start\n');
    process.exit(1);
  }
});

db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='responses'", (err, row) => {
  if (err) {
    console.error('Error checking for tables:', err);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.log('\n❌ Database tables not found. Please run the server first to create tables:');
    console.log('   npm start\n');
    db.close();
    process.exit(1);
  }

  // Check current count
  db.get('SELECT COUNT(*) as count FROM responses', (err, row) => {
    if (err) {
      console.error('Error counting responses:', err);
      db.close();
      process.exit(1);
    }

    console.log(`\nCurrent responses in database: ${row.count}`);
    console.log('Generating 20 sample responses...\n');

    db.close();
    generateSampleData(20);
  });
});
