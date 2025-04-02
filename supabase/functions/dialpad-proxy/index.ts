
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

    try {
      const response = await fetch(targetUrl, options);
      let responseData;
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        // Handle non-JSON responses gracefully
        const text = await response.text();
        if (debug) console.log("Non-JSON response:", text.substring(0, 200) + "...");
        
        responseData = { 
          _nonJson: true, 
          text: text.substring(0, 1000) // Truncate long responses
        };
      }
      
      // Return the response with appropriate status code
      return new Response(
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        }),
        {
          status: 200, // Always return 200 from our proxy, with actual status in the body
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      if (debug) console.error("Fetch error:", fetchError);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch from Dialpad API", 
          details: fetchError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in dialpad-proxy:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
