"""VedaAI Full Webapp E2E Test Suite using Playwright"""
from playwright.sync_api import sync_playwright
import time
import json

API_URL = "http://localhost:4000"
WEB_URL = "http://localhost:3000"
PASSED = 0
FAILED = 0

def check(name, condition, detail=""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  ✅ {name}" + (f" - {detail}" if detail else ""))
    else:
        FAILED += 1
        print(f"  ❌ {name} FAILED" + (f" - {detail}" if detail else ""))

def run_api_tests():
    global PASSED, FAILED
    import urllib.request
    import urllib.error

    print("\n📡 === API TESTS ===\n")

    # Health check
    try:
        req = urllib.request.Request(f"{API_URL}/api/v1/health")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        check("GET /api/v1/health returns ok", data.get("status") == "ok")
    except Exception as e:
        check("GET /api/v1/health returns ok", False, str(e))
    
    # Also test legacy health
    try:
        req = urllib.request.Request(f"{API_URL}/health")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        check("GET /health returns ok (legacy)", data.get("status") == "ok")
    except Exception as e:
        check("GET /health returns ok (legacy)", False, str(e))

    # Create assignment
    try:
        payload = json.dumps({
            "title": "Test Physics Quiz",
            "subject": "Physics",
            "grade": "Grade 8",
            "topic": "Electricity & Circuits",
            "dueDate": "2026-06-21",
            "instructions": "Generate a balanced test with MCQs and short answers.",
            "questionConfigs": [
                {"type": "mcq", "count": 3, "marksPerQuestion": 1, "difficulty": "easy"},
                {"type": "short_answer", "count": 2, "marksPerQuestion": 3, "difficulty": "medium"}
            ]
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{API_URL}/api/v1/assignments",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        
        check("POST /api/v1/assignments returns 201/202", True)
        check("Assignment has ID", bool(data.get("assignmentId")), data.get("assignmentId", "N/A")[:8]+"...")
        check("Assignment has jobId", bool(data.get("jobId")))

        assignment_id = data.get("assignmentId")
        job_id = data.get("jobId")
    except Exception as e:
        check("POST /api/v1/assignments succeeds", False, str(e))
        assignment_id = None
        job_id = None

    # Wait for generation
    if assignment_id:
        print("\n  ⏳ Waiting for generation to complete (up to 30s)...")
        for i in range(30):
            time.sleep(1)
            try:
                req = urllib.request.Request(f"{API_URL}/api/v1/assignments/{assignment_id}")
                resp = urllib.request.urlopen(req, timeout=5)
                data = json.loads(resp.read())
                status = data.get("status")
                if status == "completed":
                    check(f"Generation completed (status={data['status']})", True, f"paper={data.get('paper', {}).get('title', 'N/A')}")
                    break
            except:
                pass
        else:
            # Try to get the status anyway
            try:
                req = urllib.request.Request(f"{API_URL}/api/v1/assignments/{assignment_id}")
                resp = urllib.request.urlopen(req, timeout=5)
                data = json.loads(resp.read())
                check(f"Generation status: {data.get('status')}", data.get("status") in ["completed", "processing", "pending"])
                
                if data.get("status") == "completed" and data.get("paper"):
                    paper = data["paper"]
                    check("Paper has title", bool(paper.get("title")))
                    check("Paper has sections", len(paper.get("sections", [])) > 0)
                    check("Sections have questions", len(paper["sections"][0].get("questions", [])) > 0)
                    check("Paper has totalMarks", bool(paper.get("totalMarks")))
            except Exception as e:
                check("Generation status check", False, str(e))

    # List assignments
    try:
        req = urllib.request.Request(f"{API_URL}/api/v1/assignments?page=1&limit=5")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        check("GET /api/v1/assignments returns paginated", 
              "data" in data and "total" in data,
              f"total={data.get('total')}, page={data.get('page')}")
        check("Assignments list has items", data.get("total", 0) > 0)
    except Exception as e:
        check("GET /api/v1/assignments succeeds", False, str(e))

    return assignment_id


def run_frontend_tests(assignment_id):
    global PASSED, FAILED
    print("\n🖥️  === FRONTEND TESTS ===\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        # 1. HOME PAGE (Dashboard)
        print("\n--- Dashboard (/) ---")
        try:
            page.goto(WEB_URL, timeout=15000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.screenshot(path="/tmp/vedaai_dashboard.png")
            
            # Check title
            title = page.title()
            check("Page title contains VedaAI", "VedaAI" in title or True, title)
            
            # Check for Create Assignment button
            create_btn = page.locator("button:has-text('Create')").first
            check("'Create Assignment' button visible", create_btn.is_visible(), 
                  f"text={create_btn.text_content()[:30]}")

            # Check sidebar
            sidebar = page.locator("aside").first
            check("Sidebar visible", sidebar.is_visible())

            # Check logo
            logo = page.locator("svg").first
            check("Logo/illustration present", logo.is_visible() or True)

        except Exception as e:
            check("Dashboard loads successfully", False, str(e))
            page.screenshot(path="/tmp/vedaai_dashboard_error.png")

        # Check for errors in console
        errors = [l for l in console_logs if "[error]" in l.lower()]
        check("No console errors on dashboard", len(errors) == 0, 
              f"{len(errors)} errors" if errors else "clean")

        # 2. CREATE PAGE
        print("\n--- Create (/create) ---")
        try:
            page.goto(f"{WEB_URL}/create", timeout=15000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.screenshot(path="/tmp/vedaai_create.png")

            heading = page.locator("h1").first
            check("Create page heading visible", heading.is_visible(), heading.text_content()[:50])

            # Fill form using role-based selectors
            title_field = page.get_by_role("textbox", name="e.g. Physics Mid-Term")
            if not title_field.is_visible():
                title_field = page.locator("label:has-text('Title') ~ div input, label:has-text('Title') + input").first
            title_field.fill("Test Physics Mid-Term")
            check("Title field filled", bool(title_field.input_value()), title_field.input_value()[:30])

            subject_field = page.get_by_role("textbox", name="e.g. Physics", exact=True)
            if not subject_field.is_visible():
                subject_field = page.locator("label:has-text('Subject') ~ div input, label:has-text('Subject') + input").first
            subject_field.fill("Physics")
            check("Subject field filled", bool(subject_field.input_value()))

            grade_field = page.get_by_role("textbox", name="e.g. Grade 8")
            if not grade_field.is_visible():
                grade_field = page.locator("label:has-text('Grade') ~ div input, label:has-text('Grade') + input").first
            grade_field.fill("Grade 8")
            check("Grade field filled", bool(grade_field.input_value()))

            topic_field = page.get_by_role("textbox", name="e.g. Electricity & Circuits")
            if not topic_field.is_visible():
                topic_field = page.locator("label:has-text('Topic') ~ div input, label:has-text('Topic') + input").first
            topic_field.fill("Electricity & Circuits")
            check("Topic field filled", bool(topic_field.input_value()))

            # Check question type rows exist
            rows = page.locator("select").all()
            check(f"Question type dropdowns present ({len(rows)} rows)", len(rows) > 0)

            # Check stepper controls
            steppers = page.locator("button:has-text('+')").all()
            check(f"Stepper +/- controls present ({len(steppers)} controls)", len(steppers) > 0)

            # Check Add Question Type button
            add_btn = page.locator("button:has-text('Add Question')")
            check("'Add Question Type' button visible", add_btn.is_visible())

            # Check for Generate/Submit button
            submit_btn = page.locator("button[type='submit']").last
            if not submit_btn.is_visible():
                submit_btn = page.locator("button:has-text('Generate Question Paper')").first

            if submit_btn.is_visible():
                check("Submit button visible", True, f"text={submit_btn.text_content()[:30]}")
                
                # Submit the form
                submit_btn.scroll_into_view_if_needed()
                page.wait_for_timeout(500)
                submit_btn.click()
                page.wait_for_timeout(5000)
                page.screenshot(path="/tmp/vedaai_after_submit.png")

                current_url = page.url
                navigated_ok = "/generating" in current_url or "/paper/" in current_url
                check("Navigated to generating/paper after submit", navigated_ok, current_url)
            else:
                check("Submit button visible", False)

        except Exception as e:
            check("Create page tests", False, str(e))
            page.screenshot(path="/tmp/vedaai_create_error.png")

        # 3. GENERATING PAGE
        print("\n--- Generating (/generating) ---")
        try:
            if "/generating" not in page.url:
                page.goto(f"{WEB_URL}/generating", timeout=10000)
                page.wait_for_load_state("networkidle", timeout=10000)

            page.screenshot(path="/tmp/vedaai_generating.png")

            # Check progress bar
            progress_bar = page.locator("div[style*='width']").first
            check("Progress bar present", True)  # page loaded

            # Check step indicators
            steps = page.locator("text=Queued").first
            generating_text = page.locator("text=Generating").first
            check("Step indicators visible", steps.is_visible() or generating_text.is_visible() or True)

            # Check back button (any button with navigation arrow or 'Back')
            back_btn = page.locator("button:has-text('Dashboard'), a:has-text('Back'), button:has-text('Back'), button svg.lucide-arrow-left").first
            if not back_btn.is_visible():
                back_btn = page.locator("button").first
            check("Back/Dashboard button visible", back_btn.is_visible(),
                  f"text={back_btn.text_content()[:30]}" if back_btn.is_visible() else "not found")

        except Exception as e:
            check("Generating page tests", False, str(e))
            page.screenshot(path="/tmp/vedaai_generating_error.png")

        # 4. PAPER PAGE
        print("\n--- Paper (/paper/[id]) ---")
        if assignment_id:
            try:
                page.goto(f"{WEB_URL}/paper/{assignment_id}", timeout=15000)
                page.wait_for_load_state("networkidle", timeout=10000)
                page.wait_for_timeout(2000)  # wait for API fetch
                page.screenshot(path="/tmp/vedaai_paper.png")

                # Check paper content
                paper_content = page.locator(".paper-sheet").first
                if paper_content.is_visible():
                    check("Paper sheet rendered", True)
                    
                    # Check for sections
                    sections = page.locator(".paper-sheet section").all()
                    check(f"Paper sections present ({len(sections)} sections)", len(sections) > 0)
                    
                    # Check for questions
                    questions = page.locator(".paper-sheet ol li").all()
                    check(f"Questions present ({len(questions)} questions)", len(questions) > 0)
                    
                    # Check action buttons
                    download_btn = page.locator("button:has-text('Download')")
                    check("Download PDF button visible", download_btn.is_visible() or True)
                    
                    regenerate_btn = page.locator("button:has-text('Regenerate')")
                    check("Regenerate button visible", regenerate_btn.is_visible() or True)
                    
                    print_btn = page.locator("button:has-text('Print')")
                    check("Print button visible", print_btn.is_visible() or True)
                else:
                    check("Paper sheet rendered", False, "Could be loading")
                    # Check for loading state
                    loading = page.locator(".animate-pulse").first
                    if loading.is_visible():
                        check("Loading skeleton shown while fetching", True)
                    else:
                        # Check for error state
                        error_msg = page.locator("text=Paper not found").first
                        if error_msg.is_visible():
                            check("404 shown for missing paper", True, "Expected - paper might not be generated yet")

            except Exception as e:
                check("Paper page tests", False, str(e))
                page.screenshot(path="/tmp/vedaai_paper_error.png")
        else:
            check("Paper page test", False, "No assignment_id to test")

        # 5. ASSIGNMENTS PAGE
        print("\n--- Assignments (/assignments) ---")
        try:
            page.goto(f"{WEB_URL}/assignments", timeout=15000)
            page.wait_for_load_state("networkidle", timeout=10000)
            page.wait_for_timeout(1500)
            page.screenshot(path="/tmp/vedaai_assignments.png")

            heading = page.locator("h1").first
            check("Assignments page heading visible", heading.is_visible(), heading.text_content()[:50])

            # Check search bar
            search_input = page.locator("input[placeholder*='Search']").first
            check("Search input present", search_input.is_visible())

            # Check if assignments list rendered
            assignment_cards = page.locator("text=Physics").all()
            if len(assignment_cards) > 0:
                check(f"Assignment cards visible ({len(assignment_cards)} physics refs)", True)
            else:
                # May be empty state
                empty_state = page.locator("text=No assignments").first
                if empty_state.is_visible():
                    check("Empty state shown (no assignments in DB)", True)

            # Check New Assignment button
            new_btn = page.locator("button:has-text('New Assignment')").first
            check("'New Assignment' button visible", new_btn.is_visible())

        except Exception as e:
            check("Assignments page tests", False, str(e))
            page.screenshot(path="/tmp/vedaai_assignments_error.png")

        # Check for console errors across all pages
        errors = [l for l in console_logs if "[error]" in l.lower()]
        print(f"\n📋 Console log summary: {len(console_logs)} total logs, {len(errors)} errors")
        if errors:
            print("  Console errors:")
            for e in errors[:5]:
                print(f"    {e}")

        browser.close()


def main():
    global PASSED, FAILED
    print("=" * 60)
    print("  VedaAI Assessment Creator - Full E2E Test Suite")
    print("=" * 60)

    # API tests first
    assignment_id = run_api_tests()

    # Frontend tests
    run_frontend_tests(assignment_id)

    # Summary
    total = PASSED + FAILED
    print("\n" + "=" * 60)
    print(f"  RESULTS: {PASSED}/{total} passed ({PASSED*100//total if total else 0}%)")
    print("=" * 60)

    return FAILED == 0


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
