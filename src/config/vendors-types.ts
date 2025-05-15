export interface VendorType {
  name: string;          
  keywords: string[];    
  listingUrl: string;    
  extractPrompt: string; 
  scrapePrompt: string;  
  modelType: string;     
}

export const VENDOR_TYPES: VendorType[] = [
    // DJ Details
  {
    name: "DJ",
    keywords: ["dj", "music", "playlist", "entertainment", "performance", "song"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/מוסיקה.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all DJ profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a DJ profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: DJ’s name and.  
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing):
        - price_range  
        - services  
        - area  
        - hour_limits  
        - genres  
        4) Event photos (optional).  
        5) FAQs (optional): return as an array of objects, each with:
        { question: string; answer: string }  
        6) Bride’s Words (optional): return as an array of objects, each with:
        { reviewer: string; date: string; comment: string }  
        7) Social media links (optional): facebook, instagram, twitter, youtube  
        8) Website link (optional)
        9) phone number (optional)

        Return ONLY valid JSON (or an array) matching this TypeScript interface:

        \`\`\`ts
        export interface Dj {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        price_range?:  string;
        services?:     string;
        area?:         string;
        hour_limits?:  string;
        genres?:       string;
        eventImages?:  string[];
        faqs?:         { question: string; answer: string }[];
        brideReviews?: { reviewer: string; date: string; comment: string }[];
        socialMedia?:  {
            facebook?:  string;
            instagram?: string;
            twitter?:   string;
            youtube?:   string;
        };
        website?:     string;
        phone?:     string;
        vendor_type: "dj"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "DjModel"
  },
    // Hair and Makup Details
  {
    name: "Hair and Makeup",
    keywords: ["hair", "makeup", "stylist", "beauty", "hairstyle", "makeover", "salon", "beautician", "cosmetics"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/עיצוב-שיער-ואיפור.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Hair and Makup profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a Hair and Makeup profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Artist's name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing):
        - price_range  
        - Maximum number of companions  
        - Price range includes  
        4) Event photos (optional).  
        5) FAQs (optional): return as an array of objects, each with:
        { question: string; answer: string }  
        6) Bride’s Words (optional): return as an array of objects, each with:
        { reviewer: string; date: string; comment: string }  
        7) Social media links (optional): facebook, instagram, twitter, youtube  
        8) Website link (optional)
        9) phone number (optional)
        10) the details section: save as array (optional)

        Return ONLY valid JSON (or an array) matching this TypeScript interface:

        \`\`\`ts
        export interface Dj {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        price_range?:  string;
        max_companions?:     string;
        price_include?:         string;
        eventImages?:  string[];
        faqs?:         { question: string; answer: string }[];
        brideReviews?: { reviewer: string; date: string; comment: string }[];
        socialMedia?:  {
            facebook?:  string;
            instagram?: string;
            twitter?:   string;
            youtube?:   string;
        };
        website?:     string;
        phone?:     string;
        details?:  string[];
        vendor_type: "hair and makeup"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "HairMakeupModel"
  },
  {
        // Venues
    name: "Venues",
    keywords: ["venue", "hall"],
    listingUrl: "https://urbanbridesmag.co.il/מקום-לאירוע.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of 10 Venues profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a Venues profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Venue name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing):
        - Minimum number of guests  
        - Maximum number of guests
        - Event End Time
        - Active Seasons  
        4) Event photos (optional).  
        5) FAQs (optional): return as an array of objects, each with:
        { question: string; answer: string }  
        6) Bride’s Words (optional): return as an array of objects, each with:
        { reviewer: string; date: string; comment: string }  
        7) Social media links (optional): facebook, instagram, twitter, youtube  
        8) Website link (optional)
        9) phone number (optional)
        10) the details section: save as array (optional)

        Return ONLY valid JSON (or an array) matching this TypeScript interface:

        \`\`\`ts
        export interface Dj {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        max_guests?:  string;
        min_guests?:     string;
        end_time?:         string;
        seasons?:       string;
        eventImages?:  string[];
        faqs?:         { question: string; answer: string }[];
        brideReviews?: { reviewer: string; date: string; comment: string }[];
        socialMedia?:  {
            facebook?:  string;
            instagram?: string;
            twitter?:   string;
            youtube?:   string;
        };
        website?:     string;
        phone?:     string;
        details?:  string[];
        vendor_type: "venue"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "HairMakeupModel"
  },
];

