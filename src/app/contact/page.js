'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, Clock, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import client from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

// Form validation schema matching the premium design constraints
const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Please enter a subject'),
  message: z.string().min(10, 'Your message must be at least 10 characters long'),
});

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dynamic contact info from the backend settings controller
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await client.get('/api/settings/contact-info');
        if (response.data.success && response.data.data) {
          setContactInfo(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setIsLoadingInfo(false);
      }
    };
    fetchContactInfo();
  }, []);

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await client.post('/api/settings/contact-messages', values);
      toastSuccess(response.data.message || 'Your message has been sent. Our team will contact you shortly.');
      form.reset();
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] font-sans flex flex-col">
      <main className="flex-1 flex flex-col">
        {/* Page Hero Section */}
        <section className="bg-[#2C3E50] py-16 relative overflow-hidden">
          {/* Subtle gold hairline */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843] to-[#D4A843]/0" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="font-serif text-4xl md:text-5xl text-white font-bold mb-4">
              Get in Touch
            </h1>
            <p className="font-sans text-lg text-[#F5E6C3] max-w-2xl mx-auto">
              Whether you have a question about our verification process, membership plans, or offline alliances, our team is here to help.
            </p>
          </div>
        </section>

        {/* Contact Content Section */}
        <section className="py-16 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
              
              {/* Left Column: Contact Information */}
              <div className="lg:w-1/3 space-y-8">
                <div>
                  <h2 className="font-serif text-3xl text-[#1A1A1A] font-bold mb-2">Contact Us</h2>
                  <div className="w-12 h-1 bg-[#D4A843] mb-6"></div>
                  <p className="font-sans text-[#2C3E50] mb-8 leading-relaxed">
                    We combine decades of offline matchmaking trust with modern digital convenience. Reach out to us through any of the channels below.
                  </p>
                </div>

                {isLoadingInfo ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-[#F5E6C3]/40 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Phone */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FDF8F0] border border-[#D4A843]/30 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        <Phone className="w-5 h-5 text-[#D4A843]" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-[#1A1A1A]">Phone</h4>
                        <p className="font-sans text-[#2C3E50]">{contactInfo?.phone || '+91 98765 43210'}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FDF8F0] border border-[#D4A843]/30 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        <Mail className="w-5 h-5 text-[#D4A843]" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-[#1A1A1A]">Email</h4>
                        <p className="font-sans text-[#2C3E50]">{contactInfo?.email || 'sngsmatrimony@gmail.com'}</p>
                      </div>
                    </div>

                    {/* Office Address */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FDF8F0] border border-[#D4A843]/30 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="w-5 h-5 text-[#D4A843]" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-[#1A1A1A]">Office</h4>
                        <p className="font-sans text-[#2C3E50] leading-relaxed">
                          {contactInfo?.address || 'SNGS Matrimony Headquarters\nKerala, India'}
                        </p>
                      </div>
                    </div>

                    {/* Working Hours */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FDF8F0] border border-[#D4A843]/30 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        <Clock className="w-5 h-5 text-[#D4A843]" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-[#1A1A1A]">Working Hours</h4>
                        <p className="font-sans text-[#2C3E50]">Mon - Sat: 9:00 AM - 6:00 PM</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Contact Form */}
              <div className="lg:w-2/3">
                <Card className="border border-[#D4A843]/20 shadow-[0_4px_30px_-10px_rgba(26,26,26,0.18)] bg-white w-full rounded-2xl overflow-hidden">
                  <div className="bg-[#F5E6C3]/20 px-8 py-6 border-b border-[#D4A843]/15 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#2E7D32]" />
                    <span className="font-sans text-sm font-medium text-[#2C3E50]">Your information is strictly confidential</span>
                  </div>
                  
                  <CardContent className="p-8">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-sans text-[#1A1A1A] font-medium">Full Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter your full name"
                                    className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                                  />
                                </FormControl>
                                <FormMessage className="font-sans text-xs text-[#C75B39]" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-sans text-[#1A1A1A] font-medium">Email Address</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="your@email.com"
                                    className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                                  />
                                </FormControl>
                                <FormMessage className="font-sans text-xs text-[#C75B39]" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-sans text-[#1A1A1A] font-medium">Subject</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="How can we help you?"
                                  className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                                />
                              </FormControl>
                              <FormMessage className="font-sans text-xs text-[#C75B39]" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-sans text-[#1A1A1A] font-medium">Message</FormLabel>
                              <FormControl>
                                <textarea
                                  {...field}
                                  placeholder="Write your message here..."
                                  className="flex w-full rounded-xl border border-[#D4A843]/25 bg-transparent px-3 py-3 font-sans text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50 min-h-[150px] resize-y"
                                />
                              </FormControl>
                              <FormMessage className="font-sans text-xs text-[#C75B39]" />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold h-12 px-8 rounded-lg shadow-sm disabled:opacity-50 transition-all duration-200"
                        >
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                          {!isSubmitting && <Send className="ml-2 w-4 h-4" />}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}