import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, garmentType, referenceImage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const textileConstraints = `Generate a seamless, tileable textile fabric pattern design. The pattern must be flat, top-down view of fabric surface with no 3D elements. Style: ${prompt}. Suitable for ${garmentType || 'general apparel'}. High quality, detailed, repeating pattern, fabric texture, professional textile print.`;

    // Build message content - supports both text-to-image and image-to-image
    let messageContent: any;

    if (referenceImage) {
      // Image-to-image: use reference image for style transfer
      messageContent = [
        {
          type: "text",
          text: `Using the provided reference image as style inspiration, ${textileConstraints} Preserve the color palette and artistic style of the reference while creating a new seamless textile pattern.`,
        },
        {
          type: "image_url",
          image_url: {
            url: referenceImage,
          },
        },
      ];
    } else {
      // Text-to-image: generate from scratch
      messageContent = textileConstraints;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: messageContent }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response keys:", JSON.stringify(Object.keys(data)));

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      console.log("Full response (truncated):", JSON.stringify(data).slice(0, 500));
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({ imageUrl, description: textContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pattern error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
