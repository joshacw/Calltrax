
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
    const { endpoint, method, token, body } = await req.json();
    
    if (!endpoint || !token) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = `${DIALPAD_API_BASE_URL}${endpoint}`;
    console.log(`Making ${method || "GET"} request to Dialpad API: ${url}`);

    const options: RequestInit = {
      method: method || "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    
    // Return the response with appropriate status code
    return new Response(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        data,
      }),
      {
        status: response.ok ? 200 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
