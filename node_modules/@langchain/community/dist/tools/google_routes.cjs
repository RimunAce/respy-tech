"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleRoutesAPI = void 0;
const tools_1 = require("@langchain/core/tools");
const env_1 = require("@langchain/core/utils/env");
const zod_1 = require("zod");
const getTimezoneOffsetInHours = () => {
    const offsetInMinutes = new Date().getTimezoneOffset();
    const offsetInHours = -offsetInMinutes / 60;
    return offsetInHours;
};
/**
 * Helper functions to create the response objects for the Google Routes API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDeparture(transitDetails) {
    const { stopDetails, localizedValues } = transitDetails;
    return {
        departureTime: stopDetails.departureTime,
        localizedTime: localizedValues.departureTime.time.text,
        localizedTimezone: localizedValues.departureTime.timeZone,
        departureAddress: stopDetails.departureStop.name,
    };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createArrival(transitDetails) {
    const { stopDetails, localizedValues } = transitDetails;
    return {
        arrivalTime: stopDetails.arrivalTime,
        localizedTime: localizedValues.arrivalTime.time.text,
        localizedTimezone: localizedValues.arrivalTime.timeZone,
        arrivalAddress: stopDetails.arrivalStop.name,
    };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTravelInstructions(stepsOverview) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return stepsOverview.multiModalSegments.map((segment) => ({
        ...(segment.navigationInstruction
            ? {
                navigationInstruction: segment.navigationInstruction.instructions,
            }
            : {}),
        travelMode: segment.travelMode,
    }));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createLocalizedValues(route) {
    const { distance, duration, transitFare } = route.localizedValues;
    return {
        distance: distance.text,
        duration: duration.text,
        ...(transitFare?.text ? { transitFare: transitFare.text } : {}),
    };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTransitDetails(transitDetails) {
    const { name, nameShort, vehicle } = transitDetails.transitLine;
    return {
        ...(name ? { transitName: name } : {}),
        ...(nameShort ? { transitNameCode: nameShort } : {}),
        transitVehicleType: vehicle.type,
    };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRouteLabel(route) {
    return route.routeLabels;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterRoutes(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
route, travel_mode) {
    if (travel_mode === "TRANSIT") {
        const transitStep = route.legs[0].steps.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (step) => step.transitDetails);
        const filteredRoute = {
            departure: createDeparture(transitStep.transitDetails),
            arrival: createArrival(transitStep.transitDetails),
            travelInstructions: createTravelInstructions(route.legs[0].stepsOverview),
            localizedValues: createLocalizedValues(route),
            transitDetails: createTransitDetails(transitStep.transitDetails),
            routeLabels: createRouteLabel(route),
        };
        if (route.warnings && route.warnings.length > 0) {
            filteredRoute.warnings = route.warnings;
        }
        return filteredRoute;
    }
    else {
        const filteredRoute = {
            description: route.description,
            routeLabels: createRouteLabel(route),
            ...createLocalizedValues(route),
        };
        if (route.warnings && route.warnings.length > 0) {
            filteredRoute.warnings = route.warnings;
        }
        if (route.travelAdvisory && route.travelAdvisory.tollInfo) {
            filteredRoute.tollInfo = {
                currencyCode: route.travelAdvisory.tollInfo.estimatedPrice[0].currencyCode,
                value: route.travelAdvisory.tollInfo.estimatedPrice[0].units,
            };
        }
        return filteredRoute;
    }
}
/**
 * Class for interacting with the Google Routes API
 * It extends the StructuredTool class to perform retrieval.
 */
class GoogleRoutesAPI extends tools_1.StructuredTool {
    static lc_name() {
        return "GoogleRoutesAPI";
    }
    get lc_secrets() {
        return {
            apiKey: "GOOGLE_ROUTES_API_KEY",
        };
    }
    constructor(fields) {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("GOOGLE_ROUTES_API_KEY");
        if (apiKey === undefined) {
            throw new Error(`Google Routes API key not set. You can set it as "GOOGLE_ROUTES_API_KEY" in your environment variables.`);
        }
        this.apiKey = apiKey;
        this.name = "google_routes";
        this.description = `
    This tool retrieves routing info using the Google Routes API for driving, walking, biking, transit, and two-wheeler routes. Get departure/arrival times, travel instructions, transit fare, warnings, alternative routes, tolls prices, and routing preferences like less walking or fewer transfers.

    Output:
    - "TRANSIT" mode: Departure/arrival details, transit name/code, fare, details, warnings, alternative routes, and expected departure/arrival times.
    - Other modes: Route description, distance, duration, warnings, alternative routes, tolls prices, and expected departure/arrival times.
    
    Current time in user's timezone: ${new Date().toLocaleString()}.
`;
        this.schema = zod_1.z.object({
            origin: zod_1.z
                .string()
                .describe(`Origin address, can be either a place or an address.`),
            destination: zod_1.z
                .string()
                .describe(`Destination address, can be either a place or an address.`),
            travel_mode: zod_1.z
                .enum(["DRIVE", "WALK", "BICYCLE", "TRANSIT", "TWO_WHEELER"])
                .describe(`The mode of transport`),
            computeAlternativeRoutes: zod_1.z
                .boolean()
                .describe(`Compute alternative routes, set to true if user wants multiple routes, false otherwise.`),
            departureTime: zod_1.z
                .string()
                .optional()
                .describe(`Time that the user wants to depart.
          There cannot be a departure time if an arrival time is specified.
          Expected departure time should be provided as a timestamp in RFC3339 format: YYYY-MM-DDThh:mm:ss+00:00. The date should be in UTC time and the +00:00 represents the UTC offset. 
          For instance, if the the user's timezone is -5, the offset would be -05:00 meaning YYYY-MM-DDThh:mm:ss-05:00 with YYYY-MM-DDThh:mm:ss being in UTC. 
          For reference, here is the current time in UTC: ${new Date().toISOString()} and the user's timezone offset is ${getTimezoneOffsetInHours()}. 
          If the departure time is not specified it should not be included.          
          `),
            arrivalTime: zod_1.z
                .string()
                .optional()
                .describe(`Time that the user wants to arrive.
          There cannot be an arrival time if a departure time is specified.
          Expected arrival time should be provided as a timestamp in RFC3339 format: YYYY-MM-DDThh:mm:ss+00:00. The date should be in UTC time and the +00:00 represents the UTC offset. 
          For instance, if the the user's timezone is -5, the offset would be -05:00 meaning YYYY-MM-DDThh:mm:ss-05:00 with YYYY-MM-DDThh:mm:ss being in UTC. 
          For reference, here is the current time in UTC: ${new Date().toISOString()} and the user's timezone offset is ${getTimezoneOffsetInHours()}. 
          Reminder that the arrival time must be in the future, if the user asks for a arrival time in the past instead of processing the request, warn them that it is not possible to calculate a route for a past time.
          If the user asks for a arrival time in a passed hour today, calculate it for the next day.
          If the arrival time is not specified it should not be included. `),
            transitPreferences: zod_1.z
                .object({
                routingPreference: zod_1.z.enum(["LESS_WALKING", "FEWER_TRANSFERS"])
                    .describe(`Transit routing preference.
            By default, it should not be included.`),
            })
                .optional()
                .describe(`Transit routing preference.
           By default, it should not be included.`),
            extraComputations: zod_1.z
                .array(zod_1.z.enum(["TOLLS"]))
                .optional()
                .describe(`Calculate tolls for the route.`),
        });
    }
    async _call(input) {
        const { origin, destination, travel_mode, computeAlternativeRoutes, departureTime, arrivalTime, transitPreferences, extraComputations, } = input;
        const now = new Date();
        if (departureTime && new Date(departureTime) < now) {
            return "It is not possible to calculate a route with a past departure time. Warn the user that it is not possible to calculate a route with a past departure time.";
        }
        if (arrivalTime && new Date(arrivalTime) < now) {
            return "It is not possible to calculate a route with a past arrival time. Warn the user that it is not possible to calculate a route with a past arrival time.";
        }
        if (travel_mode !== "TRANSIT" && arrivalTime) {
            return "It is not possible to calculate an arrival time for modes other than transit. Warn the user that it is not possible to calculate an arrival time for the selected mode of transport.";
        }
        if (travel_mode === "TRANSIT" && extraComputations) {
            return "It is not possible to calculate tolls for transit mode. Warn the user that it is not possible to calculate tolls for transit mode.";
        }
        const body = {
            origin: {
                address: origin,
            },
            destination: {
                address: destination,
            },
            travel_mode,
            computeAlternativeRoutes: computeAlternativeRoutes ?? false,
            departureTime,
            arrivalTime,
            transitPreferences,
            extraComputations: extraComputations ?? [],
        };
        let fieldMask = "routes.description,routes.localizedValues,routes.travelAdvisory,routes.legs.steps.transitDetails,routes.routeLabels,routes.warnings";
        if (travel_mode === "TRANSIT") {
            fieldMask += ",routes.legs.stepsOverview";
        }
        if (travel_mode === "DRIVE" || travel_mode === "TWO_WHEELER") {
            body.routing_preference = "TRAFFIC_AWARE";
        }
        const res = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "X-Goog-Api-Key": this.apiKey,
                "X-Goog-FieldMask": fieldMask,
                "Content-Type": "application/json",
            },
        });
        if (!res.ok) {
            let message;
            try {
                const json = await res.json();
                message = json.error.message;
            }
            catch (e) {
                message = `Unable to parse error message: Google did not return a JSON response. Error: ${e}`;
            }
            throw new Error(`Got ${res.status}: ${res.statusText} error from Google Routes API: ${message}`);
        }
        const json = await res.json();
        if (Object.keys(json).length === 0) {
            return "Invalid route. The route may be too long or impossible to travel by the selected mode of transport.";
        }
        const routes = json.routes.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (route) => filterRoutes(route, travel_mode));
        return JSON.stringify(routes);
    }
}
exports.GoogleRoutesAPI = GoogleRoutesAPI;
