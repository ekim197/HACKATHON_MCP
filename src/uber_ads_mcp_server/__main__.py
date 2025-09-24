"""Entry point for running the Uber Ads MCP Server as a module."""

from .server import main
import asyncio

if __name__ == "__main__":
    asyncio.run(main())
