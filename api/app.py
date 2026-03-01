"""
ConnectMyTask – Fraud Detection REST API
========================================
Endpoints:
  POST /api/check/task
  POST /api/check/review
  POST /api/check/user
  POST /api/check/transaction
  POST /api/check/all
  GET  /api/health
  GET  /api/model-info

Run:
  python3 api/app.py
  # or with gunicorn:
  # gunicorn -w 2 -b 0.0.0.0:5000 "api.app:create_app()"
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask, request, jsonify
from utils.detector import FraudDetector


def create_app():
    app = Flask(__name__)
    detector = FraudDetector()

    # ─────────────────────────────────────────────────────────────
    # Health check
    # ─────────────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "ConnectMyTask Fraud Detection API"})

    # ─────────────────────────────────────────────────────────────
    # Model info
    # ─────────────────────────────────────────────────────────────
    @app.route("/api/model-info", methods=["GET"])
    def model_info():
        info = {}
        for domain, meta in detector._meta.items():
            info[domain] = {
                "trained_on": meta.get("trained_on"),
                "roc_auc":    meta.get("metrics", {}).get("roc_auc"),
                "features":   meta.get("features", []),
            }
        return jsonify(info)

    # ─────────────────────────────────────────────────────────────
    # Single-domain endpoints
    # ─────────────────────────────────────────────────────────────
    @app.route("/api/check/task", methods=["POST"])
    def check_task():
        data = request.get_json(force=True)
        result = detector.check_task(data)
        return jsonify(result.to_dict()), 200 if not result.is_flagged else 202

    @app.route("/api/check/review", methods=["POST"])
    def check_review():
        data = request.get_json(force=True)
        result = detector.check_review(data)
        return jsonify(result.to_dict()), 200 if not result.is_flagged else 202

    @app.route("/api/check/user", methods=["POST"])
    def check_user():
        data = request.get_json(force=True)
        result = detector.check_user(data)
        return jsonify(result.to_dict()), 200 if not result.is_flagged else 202

    @app.route("/api/check/transaction", methods=["POST"])
    def check_transaction():
        data = request.get_json(force=True)
        result = detector.check_transaction(data)
        return jsonify(result.to_dict()), 200 if not result.is_flagged else 202

    # ─────────────────────────────────────────────────────────────
    # Combined check
    # ─────────────────────────────────────────────────────────────
    @app.route("/api/check/all", methods=["POST"])
    def check_all():
        """
        Body: {
          "task": {...},        # optional
          "review": {...},      # optional
          "user": {...},        # optional
          "transaction": {...}  # optional
        }
        """
        body = request.get_json(force=True)
        result = detector.check_all(
            task=body.get("task"),
            review=body.get("review"),
            user=body.get("user"),
            transaction=body.get("transaction"),
        )
        status = 202 if result["any_flagged"] else 200
        return jsonify(result), status

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
