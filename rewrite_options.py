import re

with open('src/components/LiveMqttTester.tsx', 'r') as f:
    content = f.read()

content = content.replace("  Fan\n  Lightbulb,", "  Fan,\n  Lightbulb,")

with open('src/components/LiveMqttTester.tsx', 'w') as f:
    f.write(content)

