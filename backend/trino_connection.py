import trino
import logging
from trino.auth import OAuth2Authentication
import urllib3
import pandas as pd
from typing import Optional, List, Any, Dict
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class TrinoConnection:
    def __init__(self, host: str = 'trino.ops.eks.

