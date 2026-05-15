# import asyncio
# import json
# from playwright.async_api import async_playwright

# async def get_schemes():
#     schemes = []
#     api_responses = []

#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=False)
#         context = await browser.new_context(
#             user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
#         )
#         page = await context.new_page()

#         async def handle_response(response):
#             url = response.url
#             if "api.myscheme.gov.in" in url:
#                 try:
#                     data = await response.json()
#                     api_responses.append({"url": url, "data": data})
#                     print(f"✅ {url}")
#                     print(json.dumps(data, indent=2)[:500])
#                     print("---")
#                 except:
#                     pass

#         page.on("response", handle_response)

#         # just browse the main page
#         await page.goto("https://www.myscheme.gov.in", wait_until="networkidle")
#         await page.wait_for_timeout(8000)

#         # scroll down to trigger more loads
#         await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
#         await page.wait_for_timeout(3000)

#         print(f"\nTotal API responses: {len(api_responses)}")
#         await browser.close()

# asyncio.run(get_schemes())

import asyncio
import json
from playwright.async_api import async_playwright

async def fetch_karnataka_schemes():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()
        
        captured_data = None
        
        async def handle_response(response):
            nonlocal captured_data
            url = response.url
            if "api.myscheme.gov.in/search/v6/schemes" in url and "size=" in url:
                if "Karnataka" in url or "%22Karnataka%22" in url:
                    print(f"\n🎯 Found Karnataka schemes API!")
                    try:
                        data = await response.json()
                        if data.get("status") == "Success":
                            captured_data = data
                            
                            # Access the correct path: data.data.hits.items
                            hits_items = data['data']['hits']['items']
                            total = data['data']['hits']['page']['total']
                            
                            print(f"✅ Captured {len(hits_items)} schemes out of {total} total")
                            
                            if len(hits_items) > 0:
                                print(f"📝 First scheme: {hits_items[0]['fields']['schemeName']}")
                    except Exception as e:
                        print(f"Error parsing: {e}")
        
        page.on("response", handle_response)
        
        # Navigate directly to Karnataka filtered URL
        print("\n🔍 Loading Karnataka schemes...")
        karnataka_url = "https://www.myscheme.gov.in/search?keyword=&q=%5B%7B%22identifier%22%3A%22beneficiaryState%22%2C%22value%22%3A%22All%22%7D%2C%7B%22identifier%22%3A%22beneficiaryState%22%2C%22value%22%3A%22Karnataka%22%7D%5D&sort=multiple_sort&from=0&size=10"
        
        await page.goto(karnataka_url, wait_until="networkidle")
        
        # Wait for API to load
        await page.wait_for_timeout(8000)
        
        # Process captured data
        if captured_data:
            # Correct path to schemes
            hits_items = captured_data['data']['hits']['items']
            page_info = captured_data['data']['hits']['page']
            total = page_info['total']
            page_size = page_info['size']
            total_pages = page_info['totalPages']
            
            print(f"\n{'='*60}")
            print(f"📊 SUCCESSFULLY FETCHED KARNATAKA SCHEMES")
            print(f"{'='*60}")
            print(f"Total schemes: {total}")
            print(f"Schemes on page 1: {len(hits_items)}")
            print(f"Total pages available: {total_pages}")
            print(f"Page size: {page_size}")
            
            if hits_items and len(hits_items) > 0:
                print(f"\n📋 FIRST SCHEME FULL STRUCTURE:")
                print(json.dumps(hits_items[0], indent=2))
                
                # Save the complete response
                with open("karnataka_schemes_complete.json", "w", encoding="utf-8") as f:
                    json.dump(captured_data, f, indent=2, ensure_ascii=False)
                print(f"\n✅ Saved complete response to karnataka_schemes_complete.json")
                
                # Save just the schemes list
                with open("karnataka_schemes_list.json", "w", encoding="utf-8") as f:
                    json.dump({
                        "total": total,
                        "page": page_info,
                        "schemes": hits_items
                    }, f, indent=2, ensure_ascii=False)
                print(f"✅ Saved schemes list to karnataka_schemes_list.json")
                
                # Print names of first 10 schemes
                print(f"\n📝 First 10 Karnataka schemes:")
                for i, scheme in enumerate(hits_items[:10], 1):
                    scheme_name = scheme['fields']['schemeName']
                    print(f"   {i}. {scheme_name}")
                
                # Show available fields in each scheme
                if hits_items:
                    print(f"\n🔑 Available fields in each scheme (inside 'fields' object):")
                    first_scheme_fields = hits_items[0]['fields']
                    for key in first_scheme_fields.keys():
                        print(f"   - {key}")
            else:
                print("\n⚠️ No schemes found in the response")
        else:
            print("\n❌ No API response captured!")
        
        await browser.close()

asyncio.run(fetch_karnataka_schemes())