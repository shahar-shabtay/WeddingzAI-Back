import express from "express";
import { vendorController } from "../controllers/vendor-controller";
import authMiddleware  from "../common/auth-middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: API for Vendors (all, summary, user vendors, book vendor, unbooked vendor, relevants, search)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Vendor:
 *       type: object
 *       required:
 *         - name
 *         - vendorType
 *         - sourceUrl
 *       properties:
 *         name:
 *           type: string
 *           description: Vendor name
 *         vendorType:
 *           type: string
 *           description: Vendor type (DJ, Venue, etc.)
 *         coverImage:
 *           type: string
 *           description: Cover image URL
 *         profileImage:
 *           type: string
 *           description: Profile image URL
 *         eventImages:
 *           type: array
 *           items:
 *             type: string
 *           description: Event image URLs
 *         about:
 *           type: string
 *           description: About the vendor
 *         price_range:
 *           type: string
 *           description: Price range
 *         services:
 *           type: string
 *           description: Services offered
 *         area:
 *           type: string
 *           description: Area served
 *         genres:
 *           type: string
 *           description: Genres
 *         max_companions:
 *           type: string
 *           description: Max companions
 *         price_include:
 *           type: string
 *           description: Price includes
 *         max_guests:
 *           type: string
 *           description: Max guests
 *         min_guests:
 *           type: string
 *           description: Min guests
 *         end_time:
 *           type: string
 *           description: End time
 *         seasons:
 *           type: string
 *           description: Seasons
 *         weekend:
 *           type: string
 *           description: Weekend availability
 *         serv_location:
 *           type: string
 *           description: Service location
 *         shoot_type:
 *           type: string
 *           description: Shoot type
 *         check_in:
 *           type: string
 *           description: Check-in time
 *         check_out:
 *           type: string
 *           description: Check-out time
 *         max_vendors:
 *           type: string
 *           description: Max vendors
 *         location_facilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Location facilities
 *         close_venues:
 *           type: array
 *           items:
 *             type: string
 *           description: Close venues
 *         size_range:
 *           type: string
 *           description: Size range
 *         accessorise:
 *           type: string
 *           description: Accessorise
 *         buy_options:
 *           type: string
 *           description: Buy options
 *         faqs:
 *           type: array
 *           items:
 *             type: string
 *           description: FAQs
 *         reviews:
 *           type: array
 *           items:
 *             type: string
 *           description: Reviews
 *         socialMedia:
 *           type: object
 *           properties:
 *             facebook:
 *               type: string
 *             instagram:
 *               type: string
 *             twitter:
 *               type: string
 *             youtube:
 *               type: string
 *           description: Social media links
 *         website:
 *           type: string
 *           description: Website URL
 *         phone:
 *           type: string
 *           description: Phone number
 *         sourceUrl:
 *           type: string
 *           description: Source URL (original URL scraped)
 *         scrapedAt:
 *           type: string
 *           format: date-time
 *           description: When the vendor was scraped
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional details
 *       example:
 *         name: "DJ Awesome"
 *         vendorType: "DJ"
 *         coverImage: "https://example.com/cover.jpg"
 *         profileImage: "https://example.com/profile.jpg"
 *         eventImages: ["https://example.com/event1.jpg", "https://example.com/event2.jpg"]
 *         about: "Professional DJ for weddings and parties."
 *         price_range: "1500 ILS - 2500 ILS"
 *         services: "DJ, Lighting"
 *         area: "Tel Aviv"
 *         genres: "Pop, Dance"
 *         max_companions: "2"
 *         price_include: "DJ set, Lighting, Sound equipment"
 *         max_guests: "500"
 *         min_guests: "50"
 *         end_time: "02:00"
 *         seasons: "All year"
 *         weekend: "Yes"
 *         serv_location: "Tel Aviv and surrounding areas"
 *         shoot_type: "None"
 *         check_in: "18:00"
 *         check_out: "03:00"
 *         max_vendors: "Unlimited"
 *         location_facilities: ["Parking", "Stage"]
 *         close_venues: ["Venue A", "Venue B"]
 *         size_range: "Small-Medium"
 *         accessorise: "Disco ball, Fog machine"
 *         buy_options: "Per event"
 *         faqs: ["Do you bring your own equipment?", "How long is your set?"]
 *         reviews: ["Great DJ!", "Everyone loved the music."]
 *         socialMedia:
 *           facebook: "https://facebook.com/djawesome"
 *           instagram: "https://instagram.com/djawesome"
 *           twitter: ""
 *           youtube: ""
 *         website: "https://djawesome.com"
 *         phone: "+972-50-1234567"
 *         sourceUrl: "https://urbanbridesmag.co.il/vendor/djawesome"
 *         scrapedAt: "2025-06-13T15:00:00Z"
 *         details: ["Special package for weddings", "Optional MC service"]
 */



// GET
/**
 * @swagger
 * /vendors/all:
 *   get:
 *     summary: Get all vendors in the db
 *     tags: [Vendors]
 *     responses:
 *       200:
 *         description: List of all vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 *       500:
 *         description: Internal server error
 */
router.get("/all", vendorController.getAll.bind(vendorController));

/**
 * @swagger
 * /vendors/summary:
 *   get:
 *     summary: Get summary of user vendors (count per type)
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor summary by type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 counts:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to load vendor summary
 */
router.get("/summary",authMiddleware, vendorController.getVendorSummary);

/**
 * @swagger
 * /vendors/mine:
 *   get:
 *     summary: Get user's relevant vendors
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/mine', authMiddleware, vendorController.getUserVendors.bind(vendorController));

/**
 * @swagger
 * /vendors/booked:
 *   get:
 *     summary: Get user's booked vendors
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   vendorType:
 *                     type: string
 *                   vendor:
 *                     $ref: '#/components/schemas/Vendor'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/booked",authMiddleware, vendorController.getUserBookedVendors.bind(vendorController)); 

/**
 * @swagger
 * /vendors/relevant:
 *   get:
 *     summary: Refetch relevant vendors based on user's TDL tasks
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of updated relevant vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/relevant",authMiddleware, vendorController.refetchRelevantVendors);

/**
 * @swagger
 * /vendors/type/{type}:
 *   get:
 *     summary: Get vendors by type
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor type (DJ, Venue, etc.)
 *     responses:
 *       200:
 *         description: List of vendors of the given type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/type/:type",authMiddleware, vendorController.getByType.bind(vendorController));
/**
 * @swagger
 * /vendors/search:
 *   get:
 *     summary: Search vendors by name and/or type
 *     tags: [Vendors]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for vendor name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by vendor type
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/search",authMiddleware, vendorController.search.bind(vendorController));

/**
 * @swagger
 * /vendors/{id}:
 *   get:
 *     summary: Get vendor by ID
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id",authMiddleware, vendorController.getById.bind(vendorController));

/**
 * @swagger
 * /vendors/can-send-to-ai:
 *   post:
 *     summary: Check if a task can be sent to AI
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task
 *             properties:
 *               task:
 *                 type: string
 *                 description: The task text to check
 *     responses:
 *       200:
 *         description: AI capability check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 canSend:
 *                   type: boolean
 *                 vendorType:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/can-send-to-ai", authMiddleware, vendorController.canSendToAI);

router.post("/research/background", authMiddleware, vendorController.startBackgroundResearch); 

//PATCH
/**
 * @swagger
 * /vendors/book:
 *   patch:
 *     summary: Toggle booking of a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *             properties:
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking status updated
 *       400:
 *         description: Missing user or vendor ID
 *       500:
 *         description: Internal server error
 */
router.patch("/book",authMiddleware, vendorController.toggleBooked);

/**
 * @swagger
 * /vendors/cancel:
 *   patch:
 *     summary: Cancel vendor booking
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *             properties:
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking canceled
 *       404:
 *         description: Vendor not booked
 *       400:
 *         description: Missing user or vendor ID
 *       500:
 *         description: Internal server error
 */
router.patch("/cancel",authMiddleware, vendorController.cancelBook);
export default router;