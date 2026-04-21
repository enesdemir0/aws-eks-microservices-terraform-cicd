def test_health_returns_200(client):
    res = client.get("/health")
    assert res.status_code == 200


def test_health_body(client):
    res = client.get("/health")
    body = res.json()
    assert body.get("status") == "healthy"
    assert "service" in body


def test_unknown_route_returns_404(client):
    res = client.get("/does-not-exist")
    assert res.status_code == 404
