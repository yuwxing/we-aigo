#!/bin/bash
cd /app/data/所有对话/主对话/we-aigo/交付/任务119
python .skills/skill_create-ppt/scripts/generate_batch.py << 'EOF'
{
  "ppt_title": "Unit5_听说课件",
  "channel": "feishu",
  "ppt_content": [
    {
      "page_id": 1,
      "prompt": "生成一张PPT封面页。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、活力。\n\n页面中央位置展示主标题「Unit 5 Here and There」，白色粗体，字号小。\n主标题下方展示副标题「Listening & Speaking 听说训练」，白色，字号更小。\n页面底部小字显示「七年级英语下册」\n\n页面左侧配一个书本和耳机的扁平矢量插画，右侧配对话气泡插画。\n整体留白充足，聚焦标题。",
      "ref_images": []
    },
    {
      "page_id": 2,
      "prompt": "生成一张英语学习科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「学习目标 Learning Goals」位于页面顶部，白色粗体。\n\n页面主体用白色圆角卡片呈现三个目标：\n\n卡片1：\n「能够听辨并正确使用方位介词」\nCan understand and use prepositions of place\n\n卡片2：\n「掌握问路与指路的基本表达」\nMaster basic expressions for asking and giving directions\n\n卡片3：\n「能够用There be句型描述位置」\nUse \"There is/are\" to describe locations\n\n每个卡片配相关图标（耳朵图标、地图图标、位置图标）。\n\n整体布局清晰，层次分明。",
      "ref_images": []
    },
    {
      "page_id": 3,
      "prompt": "生成一张英语词汇科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「核心词汇 Core Vocabulary」位于页面顶部，白色粗体。\n\n左侧白色圆角卡片展示方位词：\n「in」在...里面\n「on」在...上面\n「under」在...下面\n「behind」在...后面\n「next to」在...旁边\n「in front of」在...前面\n\n右侧白色圆角卡片展示地点词：\n「school 学校」\n「library 图书馆」\n「hospital 医院」\n「restaurant 餐厅」\n「park 公园」\n「post office 邮局」\n\n每个单词配简洁的物品或地点小图标。\n整体布局整齐，便于记忆。",
      "ref_images": []
    },
    {
      "page_id": 4,
      "prompt": "生成一张英语对话科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「问路与指路 Asking for Directions」位于页面顶部，白色粗体。\n\n页面左侧展示问路方，用浅蓝色气泡框：\n「Excuse me, where is the library?」\n打扰一下，图书馆在哪里？\n\n「How do I get to the park?」\n去公园怎么走？\n\n「Is it far from here?」\n离这里远吗？\n\n页面右侧展示指路方，用浅黄色气泡框：\n「Go straight and turn left.」\n直走然后左转。\n\n「It's next to the bank.」\n它在银行旁边。\n\n「It's about 5 minutes' walk.」\n步行大约5分钟。\n\n底部配两个人物简笔插画，一问一答。\n整体对话感强，便于模仿练习。",
      "ref_images": []
    },
    {
      "page_id": 5,
      "prompt": "生成一张英语语法科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「There be句型 There be Structure」位于页面顶部，白色粗体。\n\n页面中央用白色大卡片展示句型结构：\n\n「There is + 单数名词」\nThere is a book on the desk.\n桌上有一本书。\n\n「There are + 复数名词」\nThere are three students in the classroom.\n教室里有三个学生。\n\n「就近原则」\nThere is a pen and two books on the table.\n（be动词与最近的名词一致）\n\n每个例句配相关物品的小插画（书、桌子、学生）。\n整体结构清晰，语法要点突出。",
      "ref_images": []
    },
    {
      "page_id": 6,
      "prompt": "生成一张英语对话科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「情境对话1 Situational Dialogue 1」位于页面顶部，白色粗体，副标题「在公园里 At the Park」。\n\n左侧展示中文翻译，右侧展示英文原文，用不同的颜色区分：\n\nA: 打扰一下，请问最近的厕所在哪里？\nA: Excuse me, where is the nearest restroom?\n\nB: 它在邮局的旁边。\nB: It's next to the post office.\n\nA: 远吗？\nA: Is it far from here?\n\nB: 不远，就在前面的公园里面。\nB: No, it's in the park, right in front.\n\n底部配公园场景的扁平插画，包含树木、长椅和建筑。\n整体生动，便于情景模拟。",
      "ref_images": []
    },
    {
      "page_id": 7,
      "prompt": "生成一张英语对话科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「情境对话2 Situational Dialogue 2」位于页面顶部，白色粗体，副标题「在学校 At School」。\n\n左侧展示中文翻译，右侧展示英文原文：\n\nS: 老师，请问图书馆在哪儿？\nS: Teacher, where is the library?\n\nT: 图书馆在教学楼的二楼，在教室的后面。\nT: The library is on the second floor of the teaching building, behind the classrooms.\n\nS: 谢谢！\nS: Thank you!\n\nT: 不客气。还有问题吗？\nT: You're welcome! Do you have any other questions?\n\n底部配学校场景的扁平插画，包含教学楼、图书馆图标。\n整体校园感强，便于学习模仿。",
      "ref_images": []
    },
    {
      "page_id": 8,
      "prompt": "生成一张英语听力技巧科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「听力技巧 Listening Tips」位于页面顶部，白色粗体。\n\n页面用四个白色圆角卡片横向排列展示四个技巧：\n\n卡片1「预读选项」\nListen to the options before the passage\n图片：眼睛图标\n\n卡片2「捕捉关键词」\nFocus on key words like locations and directions\n图片：耳朵图标\n\n卡片3「注意数字」\nNumbers and distances are often tested\n图片：数字图标\n\n卡片4「做好笔记」\nWrite down key information while listening\n图片：笔和本子图标\n\n每个卡片有编号（1/2/3/4）和简洁说明。\n整体布局整齐，便于学习掌握。",
      "ref_images": []
    },
    {
      "page_id": 9,
      "prompt": "生成一张英语口语练习科普海报。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。\n\n标题「口语练习 Speaking Practice」位于页面顶部，白色粗体。\n\n页面左侧展示「跟读练习」，白色圆角卡片：\n「Listen and Repeat」\n1. Where is the library?\n2. Go straight and turn left.\n3. It's next to the bank.\n\n页面右侧展示「角色扮演」，白色圆角卡片：\n「Role-play」\n与同伴练习问路对话\nUse the patterns to make your own dialogue\n\n底部配两个学生对话的扁平插画。\n整体互动感强，鼓励开口说英语。",
      "ref_images": []
    },
    {
      "page_id": 10,
      "prompt": "生成一张PPT结尾页。\n\n扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、活力。\n\n页面中央位置展示结语「Great job! Keep practicing!」，白色粗体，字号小。\n结语下方展示「Remember: Practice makes perfect!」，白色，字号更小。\n\n页面角落点缀与话题相关的简化扁平插画元素（书本、地图、对话气泡等）。\n\n整体留白充足，轻松友好，激励学生继续学习。",
      "ref_images": []
    }
  ]
}
EOF
