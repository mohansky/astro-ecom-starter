// src/pages/api/customers/[id]/update.ts
import { updateCustomer } from '@/lib/customers';
import type { APIRoute } from 'astro'; 

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const customerId = parseInt(params.id || '0');
    
    if (!customerId || isNaN(customerId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid customer ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return new Response(JSON.stringify({
          success: false,
          error: `Missing required field: ${field}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Prepare customer data for update
    const customerData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber || '', // Phone number is optional
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode
    };

    // Update the customer
    const updated = await updateCustomer(customerId, customerData);

    if (!updated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Customer not found or could not be updated'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Customer updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Update customer API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update customer. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  // Support PUT method as well
  try {
    const customerId = parseInt(params.id || '0');
    
    if (!customerId || isNaN(customerId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid customer ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return new Response(JSON.stringify({
          success: false,
          error: `Missing required field: ${field}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Prepare customer data for update
    const customerData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber || '',
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode
    };

    const updated = await updateCustomer(customerId, customerData);

    if (!updated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Customer not found or could not be updated'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Customer updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Update customer API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update customer. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};