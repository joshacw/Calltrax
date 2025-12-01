
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DIALPAD_API_BASE_URL = "https://dialpad.com/api/v2";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "true";

    // Log the incoming request for debugging
    if (debug) {
      console.log("Received request to dialpad-proxy:", {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries([...req.headers.entries()].filter(([key]) => !key.toLowerCase().includes("auth"))),
      });
    }

    let body;
    try {
      body = await req.json();
      console.log('PL-index', body);
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Properly extract the token from the request body
    const { endpoint, method, token, body: requestBody } = body;

    if (!endpoint) {
      if (debug) console.log("Missing endpoint parameter");
      return new Response(
        JSON.stringify({ error: "Missing endpoint parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!token) {
      if (debug) console.log("Missing token parameter");
      return new Response(
        JSON.stringify({ error: "Missing token parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetUrl = `${DIALPAD_API_BASE_URL}${endpoint}`;
    if (debug) {
      console.log(`Making ${method || "GET"} request to Dialpad API: ${targetUrl}`);
      console.log(`Using token (first 5 chars): ${token.substring(0, 5)}...`);
    }

    // Create headers with Authorization using the token from the request body
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);
    headers.append("Content-Type", "application/json");
    headers.append("Accept", "application/json");

    const options = {
      method: method || "GET",
      headers,
    };

    if (requestBody && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(requestBody);
    }

    if (debug) {
      console.log("Request options for Dialpad API:", {
        method: options.method,
        url: targetUrl,
        headers: Object.fromEntries([...headers.entries()].filter(key => key[0].toLowerCase() !== "authorization")),
        body: options.body ? JSON.parse(options.body) : undefined
      });
    }

    // Add additional timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Extend timeout to 30 seconds

    try {
      options.signal = controller.signal;

      // Make the actual request to Dialpad API
      const response = await fetch(targetUrl, options);
      clearTimeout(timeoutId); // Clear the timeout now that we have a response

      let responseData;
      const contentType = response.headers.get("content-type");

      if (debug) {
        console.log(`Received response from Dialpad API: ${response.status} ${response.statusText}`);
        console.log(`Response content-type: ${contentType}`);
        console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
      }

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
        if (debug) {
          console.log("JSON response body sample:",
            JSON.stringify(responseData).substring(0, 200) + "...");
        }
      } else {
        // Handle non-JSON responses gracefully
        const text = await response.text();
        if (debug) {
          console.log("Non-JSON response:", text.substring(0, 200) + "...");
        }

        responseData = {
          _nonJson: true,
          text: text.substring(0, 2000), // Increase truncation limit for better debugging
          contentType: contentType || "unknown"
        };
      }

      // Include more detailed information in the response
      const fullResponse = new Response(
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          headers: Object.fromEntries([...response.headers.entries()]),
        }),
        {
          status: 200, // Always return 200 from our proxy, with actual status in the body
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );

      if (debug) console.log("Sending response back to client");
      return fullResponse;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (debug) {
        console.error("Fetch error details:", {
          name: fetchError.name,
          message: fetchError.message,
          cause: fetchError.cause,
          stack: fetchError.stack
        });
      }

      let errorCode = 500;
      let errorMessage = "Failed to fetch from Dialpad API";

      if (fetchError.name === "AbortError") {
        errorCode = 408; // Request Timeout
        errorMessage = "Request to Dialpad API timed out after 30 seconds";
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: fetchError.message,
          name: fetchError.name,
          isTimeout: fetchError.name === "AbortError"
        }),
        {
          status: errorCode,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in dialpad-proxy:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error",
        stack: error.stack, // Include stack trace for better debugging
        name: error.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
