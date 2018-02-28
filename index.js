const webdriver = require('selenium-webdriver');
const { By, until } = webdriver;
const firefox = require('selenium-webdriver/firefox');
// console.log(firefox.Channel)

// process.exit()
const binary = new firefox.Binary(firefox.Channel.Release);
binary.addArguments('-headless');

const driver = new webdriver.Builder()
    // .withCapabilities(capabilities)
    .forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options().setBinary(binary))
    .build();

const freeBookUrl = 'https://www.packtpub.com//packt/offers/free-learning';

// Open page
driver.get(freeBookUrl);

// Log Book title

driver.findElement(By.css('#deal-of-the-day h2')).then(title => {
  title.getText().then(text => {
    console.log(text)
  });
});

// What's next?

// Prompt to download

// if 'nay': end process

// if 'yay': Login

// Login and follow redirect to free ebook page

// Claim book / Add Book to library

// Dowload book in desired format if wanted

// Bonus point one: add command line options

// Bonus point two: check for duplicates for automated use

driver.quit();
