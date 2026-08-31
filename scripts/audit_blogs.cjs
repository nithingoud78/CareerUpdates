const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function auditBlogs() {
  const { data: blogs, error } = await supabase.from('blogs').select('*');
  if (error) {
    console.error("Error fetching blogs:", error);
    return;
  }

  console.log(`Total blogs: ${blogs.length}\n`);

  const report = [];
  
  for (const blog of blogs) {
    const wordCount = blog.content ? blog.content.split(/\s+/).length : 0;
    const hasLorem = blog.content && blog.content.toLowerCase().includes('lorem ipsum');
    const hasTodo = blog.content && blog.content.toLowerCase().includes('todo');
    
    let quality = 'OK';
    let recommendations = [];
    
    if (wordCount < 300) {
      quality = 'THIN';
      recommendations.push("Too short. Needs expansion.");
    }
    if (hasLorem) {
      quality = 'PLACEHOLDER';
      recommendations.push("Contains lorem ipsum.");
    }
    
    if (blog.author === 'John Doe' || blog.author === 'Admin') {
      recommendations.push(`Suspicious author: ${blog.author}`);
    }

    report.push({
      slug: blog.slug,
      title: blog.title,
      wordCount,
      quality,
      recommendations: recommendations.length > 0 ? recommendations.join(' ') : 'None'
    });
  }
  
  console.table(report);
  
  // Checking for duplicates
  const slugs = new Set();
  let hasDups = false;
  for(const b of blogs) {
    if(slugs.has(b.slug)) {
      console.log(`Duplicate slug found: ${b.slug}`);
      hasDups = true;
    }
    slugs.add(b.slug);
  }
  if(!hasDups) console.log("No duplicate slugs found.");
}

auditBlogs();
