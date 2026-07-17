import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class FrontendAuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        frontend = ROOT / "frontend-react"
        cls.index_html = (frontend / "index.html").read_text(encoding="utf-8")
        cls.auth_js = (frontend / "src" / "auth.js").read_text(encoding="utf-8")
        cls.api_js = (frontend / "src" / "api.js").read_text(encoding="utf-8")
        cls.tasks_jsx = (
            frontend / "src" / "components" / "TasksPanel.jsx"
        ).read_text(encoding="utf-8")
        cls.public_config = (
            frontend / "public" / "config.js"
        ).read_text(encoding="utf-8")
        cls.package = json.loads(
            (frontend / "package.json").read_text(encoding="utf-8")
        )

    def test_config_script_loads_before_app(self):
        self.assertIn('<script src="/config.js"></script>', self.index_html)
        self.assertLess(
            self.index_html.index('src="/config.js"'),
            self.index_html.index('src="/src/main.jsx"'),
        )

    def test_cognito_pkce_flow_is_present(self):
        for snippet in (
            "code_challenge_method",
            "authorization_code",
            "code_verifier",
            "/oauth2/authorize",
            "/oauth2/token",
            "/logout",
        ):
            self.assertIn(snippet, self.auth_js)

    def test_backend_api_requests_use_authenticated_fetch(self):
        self.assertIn('headers.set("Authorization"', self.api_js)
        self.assertIn("getValidAccessToken", self.api_js)
        self.assertIn("apiFetch", self.tasks_jsx)

    def test_runtime_config_contains_cognito_values(self):
        for key in (
            "API_URL",
            "COGNITO_DOMAIN",
            "COGNITO_CLIENT_ID",
            "COGNITO_REDIRECT_URI",
            "COGNITO_LOGOUT_URI",
        ):
            self.assertIn(key, self.public_config)

    def test_react_frontend_has_a_production_build(self):
        self.assertIn("react", self.package["dependencies"])
        self.assertEqual(self.package["scripts"]["build"], "vite build")

    def test_task_priority_is_sent_for_create_and_update(self):
        for snippet in (
            'const PRIORITIES = ["low", "normal", "high"]',
            'priority: normalizeTaskPriority(priority)',
            '"setPriority"',
        ):
            self.assertIn(snippet, self.tasks_jsx)


if __name__ == "__main__":
    unittest.main()
