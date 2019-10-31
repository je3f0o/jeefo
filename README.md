# jeefo
Jeefo is a "ES8 Web Application Framework" written in NodeJS. Which has CLI or 
Command Line tool Interface with many commands with many more options. In 
Front-End side it has it's own templating language and Angular like framework 
in common js pattern design. Which is very nice for NodeJS and Angular 
developers. Because since Angular 2 they moved to TypeScript. So I wanted to 
programm everything in same language. Which is one of the biggest reason to 
create this framework. In Back-End it uses expressjs. (UNDER DEVELOPMENT)

# Installation
Install with NPM
```sh
$ npm install jeefo -g
```

# Documentation
(coming soon...)

# Inner dependency tree
    - jeefo (root)
        - audio@0.0.1
        - command@0.0.3
        - component@0.0.2
        - ecma_parser@0.0.3
            -parser@0.0.24 (deduped)
        - jqlite@0.0.1
        - material@0.0.1
        - math@0.0.1
        - monkey_patcher@0.0.1
        - observer@0.0.1
        - parser@0.0.24
            - command@0.0.3 (deduped)
            - tokenizer@0.0.4 (deduped)
        - resource@0.0.2
        - template@0.0.1
            - tokenizer@0.0.4 (deduped)
        - tokenizer@0.0.4
            - utils@0.0.3 deduped
        - utils@0.0.3

# License MIT
