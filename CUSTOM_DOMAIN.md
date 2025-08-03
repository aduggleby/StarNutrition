# Custom Domain Setup for GitHub Pages

This guide will help you map a custom domain to your StarNutrition GitHub Pages site.

## Prerequisites

- A domain name registered with a domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
- Access to your domain's DNS settings

## Setup Steps

### 1. Update the CNAME file

Edit the `public/CNAME` file in this repository and replace `example.com` with your actual domain:

```
your-domain.com
```

Or with a subdomain:

```
app.your-domain.com
```

### 2. Configure DNS Settings

Choose one of the following configurations based on your domain type:

#### Option A: Apex Domain (example.com)

Add the following DNS records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | aduggleby.github.io |

#### Option B: Subdomain (app.example.com)

Add a single CNAME record:

| Type | Name | Value |
|------|------|-------|
| CNAME | app | aduggleby.github.io |

### 3. Wait for DNS Propagation

DNS changes can take anywhere from a few minutes to 48 hours to propagate globally. You can check the status using:

- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)

### 4. Enable HTTPS (Automatic)

Once the DNS is configured and GitHub verifies your domain:
1. GitHub will automatically provision an SSL certificate
2. HTTPS will be enabled automatically
3. This process can take up to 24 hours

### 5. Update Vite Configuration (if needed)

If you're using a custom domain without a subdirectory, update `vite.config.js`:

```javascript
export default defineConfig({
  base: '/', // Change from '/StarNutrition/' to '/'
  // ... rest of config
});
```

## Troubleshooting

### Domain Not Working

1. **Check DNS propagation** - Use the tools mentioned above
2. **Verify CNAME file** - Ensure it contains only your domain (no https://, no trailing /)
3. **Check GitHub Pages settings** - Go to Settings → Pages in your repository

### HTTPS Not Working

1. **Wait longer** - Certificate provisioning can take up to 24 hours
2. **Check domain verification** - Ensure DNS is properly configured
3. **Try removing and re-adding** - Delete CNAME file, push, then add it back

### Common Issues

- **"Domain not verified"** - DNS records not properly configured
- **"Certificate provisioning failed"** - Usually resolves within 24 hours
- **Site loads without styles** - May need to update the `base` in vite.config.js

## Popular Domain Registrars DNS Instructions

### Cloudflare
1. Log in to Cloudflare dashboard
2. Select your domain
3. Go to DNS settings
4. Add the records as shown above
5. Ensure proxy (orange cloud) is OFF for GitHub Pages to work

### Namecheap
1. Sign in to Namecheap
2. Go to Domain List → Manage
3. Select Advanced DNS
4. Add the A records or CNAME as needed

### GoDaddy
1. Log in to GoDaddy
2. Go to My Products → Domains
3. Click DNS next to your domain
4. Add the records as specified

## Additional Resources

- [GitHub Pages Custom Domain Documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Troubleshooting custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)
- [About custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)