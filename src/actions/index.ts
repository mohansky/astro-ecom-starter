import type { APIRoute } from "astro";
import { Resend } from "resend";
import { getSecret } from "astro:env/server";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

const resend = new Resend(getSecret("RESEND_API_KEY"));

export const server = {
  contactForm: defineAction({
    accept: "form",
    input: z.object({
      firstName: z.string().min(1, { message: "First name is required" }),
      lastName: z.string().min(1, { message: "First name is required" }),
      phone: z.string().min(1, { message: "Phone number is required" }),
      email: z.string().email({ message: "Email is required" }),
      message: z.string().min(1, { message: "Message is required" }),
    }),
    handler: async (formData) => {
      const { data, error } = await resend.emails.send({
        from: "MK <mail@mohankumar.dev>",
        to: "mohansky@gmail.com",
        subject: `Enquiry from ${formData.firstName} ${formData.lastName}`,
        html: `
                <h2>Enquiry from ${formData.firstName} ${formData.lastName}</h2>
                <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Phone:</strong> ${formData.phone}</p>
                <p><strong>Message:</strong> ${formData.message}</p>`,
      });

      if (error) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      return data;
    },
  }),
};
