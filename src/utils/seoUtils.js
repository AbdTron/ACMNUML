/**
 * SEO Utilities for ACM NUML Website
 * Provides JSON-LD schema generators and SEO helpers
 */

const SITE_NAME = 'ACM NUML'
const SITE_URL = 'https://acm.atrons.net'
const DEFAULT_IMAGE = `${SITE_URL}/icon-512.png`
const ORGANIZATION_LOGO = `${SITE_URL}/icon-512.png`

/**
 * Generate Organization schema
 */
export const generateOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ACM NUML',
    alternateName: 'ACM Student Chapter - NUML Lahore',
    url: SITE_URL,
    logo: ORGANIZATION_LOGO,
    description: 'ACM Student Chapter at National University of Modern Languages, Lahore. Promoting computing education and professional development.',
    sameAs: [
        'https://www.instagram.com/acm.numl/',
        'https://www.linkedin.com/company/acm-numl/'
    ],
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'General Inquiries',
        email: 'acm.numl@gmail.com'
    },
    address: {
        '@type': 'PostalAddress',
        addressLocality: 'Lahore',
        addressCountry: 'PK'
    }
})

/**
 * Generate Event schema
 */
export const generateEventSchema = (event) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || '',
    startDate: event.date,
    endDate: event.endDate || event.date,
    location: event.location ? {
        '@type': 'Place',
        name: event.location,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Lahore',
            addressCountry: 'PK'
        }
    } : undefined,
    image: event.imageUrl || DEFAULT_IMAGE,
    organizer: {
        '@type': 'Organization',
        name: 'ACM NUML',
        url: SITE_URL
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.isOnline
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode'
})

/**
 * Generate Article schema (for forum posts)
 */
export const generateArticleSchema = (post) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 160) || '',
    author: {
        '@type': 'Person',
        name: post.authorName || 'ACM NUML Member'
    },
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    publisher: {
        '@type': 'Organization',
        name: 'ACM NUML',
        logo: {
            '@type': 'ImageObject',
            url: ORGANIZATION_LOGO
        }
    },
    mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/forum/${post.id}`
    }
})

/**
 * Generate Person schema (for member profiles)
 */
export const generatePersonSchema = (member) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.displayName || member.name,
    description: member.bio || '',
    image: member.photoURL || member.avatar,
    memberOf: {
        '@type': 'Organization',
        name: 'ACM NUML'
    }
})

/**
 * Generate ItemList schema (for Events listing)
 */
export const generateItemListSchema = (items, itemType = 'Event') => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.slice(0, 10).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
            '@type': itemType,
            name: item.title || item.name,
            url: `${SITE_URL}/events/${item.id}`
        }
    }))
})

/**
 * Generate BreadcrumbList schema
 */
export const generateBreadcrumbSchema = (breadcrumbs) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url ? `${SITE_URL}${crumb.url}` : undefined
    }))
})

/**
 * Default SEO configurations for pages
 */
export const pageSEOConfig = {
    home: {
        title: 'ACM NUML - Computer Science Society',
        description: 'ACM Student Chapter at National University of Modern Languages, Lahore. Join us for events, workshops, hackathons, and tech talks.'
    },
    events: {
        title: 'Events | ACM NUML',
        description: 'Discover upcoming tech events, workshops, hackathons, and seminars organized by ACM NUML.'
    },
    gallery: {
        title: 'Gallery | ACM NUML',
        description: 'Browse photos from ACM NUML events, workshops, and activities.'
    },
    team: {
        title: 'Our Team | ACM NUML',
        description: 'Meet the dedicated team behind ACM NUML chapter.'
    },
    about: {
        title: 'About Us | ACM NUML',
        description: 'Learn about ACM NUML, our mission, and our commitment to fostering computing excellence.'
    },
    contact: {
        title: 'Contact Us | ACM NUML',
        description: 'Get in touch with ACM NUML for inquiries, collaborations, or feedback.'
    },
    join: {
        title: 'Join ACM NUML',
        description: 'Become a member of ACM NUML and unlock opportunities for growth, learning, and networking.'
    },
    forum: {
        title: 'Forum | ACM NUML',
        description: 'Join discussions, share knowledge, and connect with fellow tech enthusiasts.'
    },
    members: {
        title: 'Members | ACM NUML',
        description: 'Explore the ACM NUML member directory and connect with fellow members.'
    },
    feedback: {
        title: 'Feedback | ACM NUML',
        description: 'Share your feedback and suggestions to help us improve.'
    }
}

/**
 * Generate canonical URL
 */
export const getCanonicalUrl = (path) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${SITE_URL}${cleanPath}`
}
