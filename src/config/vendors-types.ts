export interface VendorType {
  name: string;          
  keywords: string[];    
  listingUrl: string;    
  extractPrompt: string; 
  scrapePrompt: string;  
  modelType: string;
  searchField: string[];
}

export const VENDOR_TYPES: VendorType[] = [
    // DJ Details
  {
    name: "DJ",
    keywords: ["dj", "music", "playlist", "entertainment", "performance", "song", "band"],
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
    modelType: "DjModel",
    searchField: ["genres", "about", "brideReviews", "services", "faqs","price_range"]
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
        - range includes  
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
        export interface HairMakeup {
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
    modelType: "HairMakeupModel",
    searchField: ["max_companions", "price_include", "about", "brideReviews", "faqs", "price_range"]
  },
    // Venues
  {
    name: "Venues",
    keywords: ["venue", "hall", "location", "place", "site", "event space", "wedding hall", "banquet hall", "garden", "estate"],
    listingUrl: "https://urbanbridesmag.co.il/מקום-לאירוע.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        scan the HTML for anchor tags <a> that link to INDIVIDUAL venue profile pages.
        Rules:
        - Collect only anchors with hrefs that point to venue PROFILE pages (not category, not listing, not pagination).
        - Return ABSOLUTE URLs only.
        - Output ONLY JSON: { "urls": ["https://...","https://..."] } with no extra text, no markdown.

        Heuristics:
        - Same domain as {{listingUrl}}
        - Path depth >= 2 (likely /<category>/<profile> or similar)
        - Exclude links with anchors (#), tel:, mailto:, query-only, or the listing itself.

        Return: { "urls": [...] }

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
        export interface Venues {
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
    modelType: "VenueModel",
    searchField: ["about", "min_guests", "max_guests", "brideReviews", "faqs", "seasons"]
  },
    // Stills
  {
    name: "Stills",
    keywords: ["photographer", "stills", "photo shoot", "photos", "photography", "shoot", "image", "pictures", "camera"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/צילום-סטילס.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Stills profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a Photographer stills profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Photographer name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing):
        - Price include  
        - Work on weekend
        - Service locations
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
        export interface Stills {
        _id:            string;
        name:           string;
        coverImage?:    string;
        profileImage?:  string;
        about?:         string;
        price_include?: string;
        weedend?:       string;
        serv_location?: string;
        eventImages?:   string[];
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
        vendor_type: "Stills"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "StillsModel",
    searchField: ["about", "price_include", "weekend", "serv_location", "faqs", "seasons", "brideReviews"]
  },
    // Video
  {
    name: "Video",
    keywords: ["videographer", "video", "cinema", "clip", "filming", "wedding video", "shoot", "recording", "movie"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/צילום-וידאו.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Video profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a Photographer Video profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Photographer name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing):
        - Price include  
        - Shoote type
        - Hours
        - Work on weekend
        - Service locations
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
        export interface Video {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        price_include?:  string;
        weedend?:     string;
        serv_location?:         string;
        shoot_type?:    string;
        hours?:       string;
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
        vendor_type: "Video"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "VideoModel",
    searchField: ["about","shoot_type", "brideReviews", "faqs", "hours", "price_include", "serv_location"]
  },
    // Ready Places
  {
    name: "ReadyPlace",
    keywords: ["getting ready", "preparation venue", "bride room", "makeup room", "getting ready place", "hair and makeup space", "hotel room", "suite"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/מקום-התארגנות.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Ready Places profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a Ready Places profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Place name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing):
        - Check In  
        - Check Out
        - Price Range
        - max guests
        - max vendors
        4) Event photos (optional).  
        5) FAQs (optional): return as an array of objects, each with:
        { question: string; answer: string }  
        6) Bride’s Words (optional): return as an array of objects, each with:
        { reviewer: string; date: string; comment: string }  
        7) Social media links (optional): facebook, instagram, twitter, youtube  
        8) Website link (optional)
        9) phone number (optional)
        10) the details section: save as array (optional)
        11) Location facilities: save as array

        Return ONLY valid JSON (or an array) matching this TypeScript interface:

        \`\`\`ts
        export interface ReadyPlace {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        check_in?:     string;
        check_out?:      string;
        price_range?:   string;
        max_guests?:    string;
        max_vendors?:   string;
        location_facilities?:         string[];
        close_venues?:    string[];
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
        vendor_type: "ReadyPlace"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "ReadyPlaceModel",
    searchField: ["about", "check_in", "check_out", "max_guests", "max_vendors","location_facilities", "faqs", "brideReviews", "price_range"]
  },
    //Gifts for guests
  {
    name: "GuestGifts",
    keywords: ["guest gifts", "giveaways", "souvenirs", "favors", "presents", "wedding gifts", "thank you gifts", "party favors"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/מתנות-לאורחים.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Guest Gifts profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a Gifts for Guests profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Shop name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing): no extra info
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
        export interface GuestGifts {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
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
        vendor_type: "GuestsGift"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "GiftsModel",
    searchField: ["about", "faqs", "brideReviews"]
  },
    // Groom Suits
  {
    name: "GroomSuits",
    keywords: ["groom", "groom suit", "tuxedo", "wedding suit", "men’s wear", "formal wear", "blazer", "tailor"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/חליפת-חתן.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Groom Suits profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a Groom Suits profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Shop name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing): 
          - Price range
          - Size Range
          - accessorise
          - buy options
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
        size_range?:   string;
        accessorise?:  string;
        buy_options?:  string
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
        vendor_type: "GroomSuits"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "GroomSuitsModel",
    searchField: ["about", "faqs", "reviwes", "price_range", "buy_options", "size_range", "accessorise"]
  },   
    // Design
  {
    name: "Design",
    keywords: ["design", "decor", "wedding design", "florist", "flowers", "centerpieces", "styling", "theme", "color palette", "visuals"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/עיצוב-והפקה.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Design profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a design profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Shop name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing): 
          - Price range
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
        export interface Design {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        price_range?:  string;
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
        vendor_type: "Design"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "Design",
    searchField: ["about", "faqs", "brideReviews", "price_range"]
  },  
    // Bride suit
  {
    name: "BrideDress",
    keywords: ["bride", "wedding dress", "bridal gown", "dress", "gown", "bride outfit", "bridal shop", "bridal wear", "tailor"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/שמלה.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Bride Dress profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a bride dress profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Shop name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing): 
          - Price range
          - size range
          - accessorise
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
        export interface BrideDress {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        price_range?:  string;
        size_range?:   string;
        accessorise?:  string;
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
        vendor_type: "BrideDress"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "BrideDress",
    searchField: ["about", "faqs", "brideReviews", "price_range", "size_range", "accessorise"]
  }, 

    // Attractions
  {
    name: "Attractions",
    keywords: ["attraction", "show", "entertainment", "surprise", "activity", "live show", "fireworks", "magician", "dance show", "performance"],
    listingUrl: "https://urbanbridesmag.co.il/הפינצטה/אטרקציות-לחתונה.html",
    extractPrompt: `
        Given the listing page at URL: {{listingUrl}},
        extract and return an array of all Attraction profile URLs found on that page.
        Only output JSON like: { "urls": ["https://…", "https://…", …] }.
            `.trim(),
    scrapePrompt: `
        You are scraping a attraction profile page at {{pageUrl}}.  
        On the page you will find these sections in order:

        1) Header: Shop name.
        2) Cover + About: profile image, followed by About block.  
        3) Extra info (optional), with exactly these keys (use empty string if missing): 
          - Price range
          - maximum guests
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
        export interface Attractions {
        _id:           string;
        name:          string;
        coverImage?:   string;
        profileImage?: string;
        about?:        string;
        price_range?:  string;
        max_guests?:    string;
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
        vendor_type: "atractions"
        }
        \`\`\`

        Use empty string (\`""\`) or empty array (\`[]\`) for any missing field.  
        Translate all text to English.  
        HTML URL: {{pageUrl}}
            `.trim(),
    modelType: "atractions",
    searchField: ["about", "price_range", "max_guests", "brideReviews", "faqs"]
  }, 
];

