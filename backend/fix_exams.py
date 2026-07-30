from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv()

client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

# We can't run ALTER TABLE via the supabase client directly,
# but we can check what columns exist by looking at insert results.
# The user needs to run this SQL in Supabase SQL Editor:

sql = """
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS "subjectName" TEXT DEFAULT '';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS "blockNo" TEXT DEFAULT '';
"""

print("Run this SQL in the Supabase Dashboard → SQL Editor:\n")
print(sql)
