
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DIALPAD_API_BASE_URL = "https://api.dialpad.com/v2";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "true";
    
    let body;
    try {
      body = await req.json();
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
    
    const { endpoint, method, token, body: requestBody } = body;
    
    if (!endpoint || !token) {
      if (debug) console.log("Missing required parameters:", { endpoint, token });
      
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetUrl = `${DIALPAD_API_BASE_URL}${endpoint}`;
    if (debug) console.log(`Making ${method || "GET"} request to Dialpad API: ${targetUrl}`);

    const options = {
      method: method || "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    };

    if (requestBody && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(requestBody);
    }

    // Add additional timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      options.signal = controller.signal;
      
      if (debug) console.log("Sending request to Dialpad with options:", {
        method: options.method,
        headers: { ...options.headers, Authorization: "Bearer [REDACTED]" },
        body: options.body ? JSON.parse(options.body) : undefined
      });
      
      const response = await fetch(targetUrl, options);
      clearTimeout(timeoutId); // Clear the timeout now that we have a response
      
      let responseData;
      const contentType = response.headers.get("content-type");
      
      if (debug) console.log(`Received response from Dialpad API: ${response.status} ${response.statusText}`);
      if (debug) console.log(`Response content-type: ${contentType}`);
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
        if (debug) console.log("JSON response body sample:", 
          JSON.stringify(responseData).substring(0, 200) + "...");
      } else {
        // Handle non-JSON responses gracefully
        const text = await response.text();
        if (debug) console.log("Non-JSON response:", text.substring(0, 200) + "...");
        
        responseData = { 
          _nonJson: true, 
          text: text.substring(0, 2000), // Increase truncation limit for better debugging
          contentType: contentType || "unknown"
        };
      }
      
      // Include more detailed information in the response
      return new Response(
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          headers: Object.fromEntries([...response.headers.entries()]),
        }),
        {
          status: 200, // Always return 200 from our proxy, with actual status in the body
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
        errorMessage = "Request to Dialpad API timed out after 15 seconds";
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
