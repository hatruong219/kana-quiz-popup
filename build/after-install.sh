#!/bin/sh
rm -f /usr/bin/kana-quiz
cat > /usr/bin/kana-quiz << 'WRAPPER'
#!/bin/sh
exec "/opt/Kana Quiz/kana-quiz" "$@"
WRAPPER
chmod +x /usr/bin/kana-quiz

sed -i 's|^Exec=.*|Exec=/usr/bin/kana-quiz %U|' /usr/share/applications/kana-quiz.desktop
