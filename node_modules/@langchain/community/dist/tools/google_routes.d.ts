import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
/**
 * Interface for parameter s required by GoogleRoutesAPI class.
 */
export interface GoogleRoutesAPIParams {
    apiKey?: string;
}
/**
 * Class for interacting with the Google Routes API
 * It extends the StructuredTool class to perform retrieval.
 */
export declare class GoogleRoutesAPI extends StructuredTool {
    static lc_name(): string;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    name: string;
    description: string;
    protected apiKey: string;
    schema: z.ZodObject<{
        origin: z.ZodString;
        destination: z.ZodString;
        travel_mode: z.ZodEnum<[
            "DRIVE",
            "WALK",
            "BICYCLE",
            "TRANSIT",
            "TWO_WHEELER"
        ]>;
        computeAlternativeRoutes: z.ZodBoolean;
        departureTime: z.ZodOptional<z.ZodString>;
        arrivalTime: z.ZodOptional<z.ZodString>;
        transitPreferences: z.ZodOptional<z.ZodObject<{
            routingPreference: z.ZodEnum<["LESS_WALKING", "FEWER_TRANSFERS"]>;
        }>>;
        extraComputations: z.ZodOptional<z.ZodArray<z.ZodEnum<["TOLLS"]>>>;
    }>;
    constructor(fields?: GoogleRoutesAPIParams);
    _call(input: z.infer<typeof GoogleRoutesAPI.prototype.schema>): Promise<string>;
}
