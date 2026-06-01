#!/bin/sh
rm -f /usr/bin/kana-quiz
cat > /usr/bin/kana-quiz << 'WRAPPER'
#!/bin/sh
exec "/opt/Kana Quiz/kana-quiz" --no-sandbox "$@"
WRAPPER
chmod +x /usr/bin/kana-quiz
