#!/usr/bin/env python3
"""创建AI创作工坊的智能体和任务"""
import psycopg2
import json

# Supabase 连接参数
DB_PARAMS = {
    'host': 'aws-1-ap-northeast-1.pooler.supabase.com',
    'port': 6543,
    'dbname': 'postgres',
    'user': 'postgres.mzjmfyoemcsoqzoooiej',
    'password': 'EsrQ2RUQA6oUSk4x',
    'connect_timeout': 15
}

def connect():
    """连接数据库"""
    return psycopg2.connect(**DB_PARAMS)

# 6个专业智能体定义
AGENTS = [
    {
        "name": "人物设定细化师",
        "capabilities": json.dumps([
            {"category": "设计", "level": 9},
            {"category": "写作", "level": 8}
        ]),
        "token_balance": 15000.0,
        "description": "专注角色形象精细刻画。根据用户需求细化人物的脸型五官、发型发色、发饰、服装款式纹样配色、身材气质。输出高精度人物设定描述，规避网红脸、五官怪异。推荐工具：即梦AI、Stable Diffusion",
        "avatar_url": "👤"
    },
    {
        "name": "动作神态优化师",
        "capabilities": json.dumps([
            {"category": "设计", "level": 9},
            {"category": "分析", "level": 7}
        ]),
        "token_balance": 15000.0,
        "description": "专注肢体动态与微表情优化。完善人物肢体动态、身体角度、手部动作、眼神微表情、面部神态、娇羞/高冷/温柔等情绪细节，符合人体结构，动作自然不僵硬不扭曲。",
        "avatar_url": "🎭"
    },
    {
        "name": "场景氛围营造师",
        "capabilities": json.dumps([
            {"category": "设计", "level": 9},
            {"category": "写作", "level": 7}
        ]),
        "token_balance": 15000.0,
        "description": "专注环境与氛围塑造。扩充环境细节：远近景物、季节、天气、花草建筑、雾气/落雪/花瓣/霓虹等特效，营造完整画面层次与氛围感。推荐工具：海艺AI、ComfyUI",
        "avatar_url": "🌄"
    },
    {
        "name": "镜头构图设计师",
        "capabilities": json.dumps([
            {"category": "设计", "level": 8},
            {"category": "分析", "level": 8}
        ]),
        "token_balance": 15000.0,
        "description": "专注画面构图与视觉引导。指定画幅比例、景别（特写/半身/全身/远景）、拍摄视角、景深强弱、画面留白、人物布局，适配壁纸/头像/海报使用场景。",
        "avatar_url": "📷"
    },
    {
        "name": "风格统一适配师",
        "capabilities": json.dumps([
            {"category": "设计", "level": 9},
            {"category": "分析", "level": 7}
        ]),
        "token_balance": 15000.0,
        "description": "专注画风与质感把控。定义画风笔触、色彩调性、画质质感、艺术流派、光影风格，统一整张画面气质，不混搭、不违和、高级细腻。",
        "avatar_url": "🎨"
    },
    {
        "name": "提示词精修师",
        "capabilities": json.dumps([
            {"category": "写作", "level": 10},
            {"category": "编程", "level": 8},
            {"category": "设计", "level": 7}
        ]),
        "token_balance": 15000.0,
        "description": "终极汇总整合专家。汇总前面5个智能体的全部细化内容，生成：1）完整版正向生图提示词（可直接复制用）2）专业负面反向提示词（规避畸形、脸崩、手脚崩坏、杂乱水印）。语言紧凑专业，适配所有主流AI绘画平台。",
        "avatar_url": "✨"
    }
]

# 10个预设场景任务
PRESET_TASKS = [
    {
        "title": "古风少女",
        "description": "主角：18岁古风少女，穿淡青色汉服。表情：温柔含蓄微微笑。动作：执伞回眸。场景：桃花林春日白天。风格：古风工笔。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "武侠大侠",
        "description": "主角：25岁侠客，黑衣束发长剑。表情：冷峻坚毅。动作：负手而立悬崖边。场景：云海山巅黄昏。风格：写意水墨。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "校园二次元",
        "description": "主角：16岁女高中生，校服双马尾。表情：开心灿烂。动作：双手比耶。场景：樱花树下白天。风格：日系二次元。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "海边治愈",
        "description": "主角：20岁少女，白色连衣裙。表情：宁静安详。动作：赤脚踩浪花。场景：黄昏海边落日。风格：治愈系水彩。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "赛博朋克",
        "description": "主角：28岁机械改造女战士。表情：冷酷霸气。动作：单手插兜。场景：霓虹都市雨夜。风格：赛博朋克。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "亲子温馨",
        "description": "主角：妈妈抱3岁小孩。表情：慈爱幸福。动作：拥抱贴脸。场景：阳光客厅午后。风格：温馨写实。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "职场精英",
        "description": "主角：30岁商务男士，西装。表情：自信从容。动作：倚靠办公桌。场景：高层落地窗城市天际线。风格：商务写实。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "奇幻精灵",
        "description": "主角：精灵少女，尖耳透明翅膀。表情：好奇灵动。动作：蹲坐花丛中。场景：魔法森林萤火虫之夜。风格：奇幻油画。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "古风CP",
        "description": "主角：古风男女一对，他穿白衣她穿红衣。表情：深情对望。动作：执手相看。场景：月下庭院荷花池。风格：古风唯美。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "萌宠拟人",
        "description": "主角：橘猫拟人少年，猫耳猫尾。表情：慵懒傲娇。动作：趴在窗台晒太阳。场景：日式和室午后。风格：可爱Q版。系统已自动拆解为7维度参数，6位专业智能体将并行细化，最终输出正向+负面提示词。",
        "budget": 800.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    }
]

# 3个自定义创作任务模板
CUSTOM_TASKS = [
    {
        "title": "自由创作-AI绘画提示词生成",
        "description": "填写你的创作需求：1)主角人物（性别/年龄/身份/几个人）2)表情心情（害羞/高冷/开心等）3)动作姿态（坐着/站着/奔跑等）4)所在场景（桃花林/海边/卧室等+白天/黄昏/夜晚）5)风格氛围（古风/二次元/写实/治愈/赛博朋克/可爱Q版）。填写完成，6位专业智能体将自动拆解7维度参数，并行细化人物/动作/场景/构图/风格，最终输出正向提示词+负面规避词，直接复制可用。",
        "budget": 500.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "角色立绘提示词",
        "description": "专注角色立绘创作。填写：1)角色描述 2)表情 3)站姿 4)背景简述 5)画风偏好。输出：半身/全身立绘提示词，适配Stable Diffusion/即梦AI等平台。",
        "budget": 600.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    },
    {
        "title": "场景氛围提示词",
        "description": "专注纯场景创作（无人物）。填写：1)场景类型 2)时间天气 3)核心元素 4)氛围感受 5)画风。输出：高质量场景生成提示词，适配AI绘画平台。",
        "budget": 600.0,
        "requirements": json.dumps([{"category": "设计", "min_level": 7}, {"category": "写作", "min_level": 6}])
    }
]

def create_agents():
    """创建6个专业智能体"""
    print("=" * 60)
    print("第一步：创建6个专业智能体")
    print("=" * 60)
    
    created_agents = []
    
    conn = connect()
    cur = conn.cursor()
    
    for agent in AGENTS:
        sql = """
            INSERT INTO agents (
                name, owner_id, capabilities, token_balance, description, avatar_url,
                total_tasks, completed_tasks, success_rate, avg_rating, created_at, updated_at
            ) VALUES (
                %s, 3, %s, %s, %s, %s,
                0, 0, 0.0, 0.0, NOW(), NOW()
            ) RETURNING id, name
        """
        cur.execute(sql, (
            agent["name"],
            agent["capabilities"],
            agent["token_balance"],
            agent["description"],
            agent["avatar_url"]
        ))
        result = cur.fetchone()
        created_agents.append({"id": result[0], "name": result[1]})
        print(f"  ✅ 创建智能体: ID={result[0]}, 名称={result[1]}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\n成功创建 {len(created_agents)} 个智能体")
    return created_agents

def create_tasks(tasks, task_type):
    """创建任务"""
    print(f"\n{'=' * 60}")
    print(f"创建{task_type}任务")
    print("=" * 60)
    
    created_tasks = []
    
    conn = connect()
    cur = conn.cursor()
    
    for task in tasks:
        sql = """
            INSERT INTO tasks (
                title, description, publisher_id, budget, requirements, status, deadline,
                created_at, updated_at
            ) VALUES (
                %s, %s, 3, %s, %s, 'open', '2026-12-31T23:59:59',
                NOW(), NOW()
            ) RETURNING id, title
        """
        cur.execute(sql, (
            task["title"],
            task["description"],
            task["budget"],
            task["requirements"]
        ))
        result = cur.fetchone()
        created_tasks.append({"id": result[0], "title": result[1]})
        print(f"  ✅ 创建任务: ID={result[0]}, 标题={result[1]}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\n成功创建 {len(created_tasks)} 个{task_type}任务")
    return created_tasks

def main():
    """主函数"""
    print("\n🚀 开始创建AI创作工坊数据...")
    
    # 创建智能体
    agents = create_agents()
    
    # 创建预设场景任务
    preset_tasks = create_tasks(PRESET_TASKS, "预设场景")
    
    # 创建自定义任务模板
    custom_tasks = create_tasks(CUSTOM_TASKS, "自定义")
    
    # 保存结果
    with open("created_agents.json", "w", encoding="utf-8") as f:
        json.dump({"agents": agents}, f, ensure_ascii=False, indent=2)
    
    with open("created_tasks.json", "w", encoding="utf-8") as f:
        json.dump({"preset_tasks": preset_tasks, "custom_tasks": custom_tasks}, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print("✨ 数据创建完成!")
    print("=" * 60)
    print(f"\n📊 统计:")
    print(f"   - 专业智能体: {len(agents)} 个")
    print(f"   - 预设场景任务: {len(preset_tasks)} 个")
    print(f"   - 自定义任务模板: {len(custom_tasks)} 个")
    print(f"\n📁 结果已保存到:")
    print(f"   - created_agents.json")
    print(f"   - created_tasks.json")

if __name__ == "__main__":
    main()
